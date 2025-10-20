import { IBaseComponent, PropTypes } from '../interfaces/IBaseComponent';

/**
 * BaseComponent
 *
 * Generic base class for lightweight Web Components that support:
 * - optional template resolution via template id or template function
 * - initial props merge and a Proxy that observes direct prop assignments
 * - a one-time template render that converts `{{prop}}` placeholders into
 *   data-bound elements, and incremental updates of those elements thereafter
 *
 * @typeParam TProps - Shape of the component props (extends PropTypes)
 * @typeParam TEvents - Shape of emitted custom event details
 */
export abstract class BaseComponent<
    TProps extends PropTypes = Record<string, never>,
    TEvents = Record<string, never>,
  >
  extends HTMLElement
  implements IBaseComponent<TProps, TEvents>
{
  /** List of observed attributes; subclasses may override. */
  static observedAttributes: string[] = [];

  /** Public props object — proxied so direct assignments can trigger updates. */
  props = {} as TProps;

  /** Optional template function that returns HTML string given locals. */
  private templateFn?: (locals?: { props: TProps }) => string;

  /** Internal reference to the proxied props object. */
  private _propsProxy?: TProps;

  /** Whether the initial template render has been completed. */
  private initialized = false;

  /** Map of propName to bound DOM elements inside the shadow root. */
  private bindings = new Map<string, HTMLElement[]>();

  /** Optional array of raw styles strings or paths provided at construction. */
  private styles?: string[];

  /** Set of style strings that should be treated as external paths. */
  private stylesIsPath = new Set<string>();

  /** Track which style strings/paths have already been added to the shadowRoot. */
  private styleAdded = new Set<string>();

  /**
   * Create a new BaseComponent.
   *
   * Accepts either:
   * - template: string (template element id) or
   * - template: function that receives a locals object with a props property and returns HTML string
   *
   * initialProps, if provided, are merged into the proxied props object so
   * subclasses should not replace `this.props` (replacing would drop the proxy).
   *
   * styles, if provided, may be:
   * - an array of inline CSS strings (each will be injected into a <style> in the shadowRoot), or
   * - an array of path/URL strings (relative path or ending with ".css" or starting with "/" or "./" or "http")
   *   which will be added as individual <link rel="stylesheet"> entries in the shadowRoot.
   *
   * @param template - Optional template id or template function
   * @param initialProps - Optional initial prop values to merge into this.props
   * @param styles - Optional array of CSS strings or paths to include in the shadow root
   */
  constructor(
    template?: string | ((locals?: { props: TProps }) => string),
    initialProps?: Partial<TProps>,
    styles?: string[]
  ) {
    super();
    this.attachShadow({ mode: 'open' });

    // store styles (decide whether each is a path)
    if (Array.isArray(styles) && styles.length > 0) {
      this.styles = styles.filter(Boolean);
      const pathRegex = /(^\.\/|^\/|\.css$|^https?:\/\/)/i;
      for (const s of this.styles) {
        if (pathRegex.test(s)) this.stylesIsPath.add(s);
      }
    }

    // proxy handler ensures direct assignments update bindings after init
    const handler: ProxyHandler<Record<string, unknown>> = {
      set: (target, prop, value) => {
        const res = Reflect.set(target, prop as string, value);
        if (this.initialized && typeof prop === 'string') {
          this.updateBindings(prop as keyof TProps & string);
        }
        return res;
      },
    };

    // create proxied props object and use it for this.props
    this._propsProxy = new Proxy(
      this.props as unknown as Record<string, unknown>,
      handler
    ) as TProps;
    this.props = this._propsProxy;

    // merge initial props into the proxy (keeps proxy intact)
    if (initialProps) {
      Object.assign(this.props, initialProps as TProps);
    }

    if (typeof template === 'string') {
      // treat as template id; create a fn that resolves the template when called
      this.templateId = template;
      this.templateFn = () => {
        const tpl = document.getElementById(
          this.templateId ?? ''
        ) as HTMLTemplateElement | null;
        if (!tpl) {
          console.warn(`BaseComponent: template with id "${this.templateId}" not found.`);
          return '';
        }
        return tpl.innerHTML;
      };
    } else if (typeof template === 'function') {
      this.templateFn = template;
    }
  }

  /** Optional template id if a template element is used. */
  templateId?: string | undefined;

  /**
   * Set the template to use by id and trigger a render.
   *
   * @param id - Template element id
   */
  useTemplateById(id: string): void {
    this.templateId = id;
    const tpl = document.getElementById(id) as HTMLTemplateElement | null;
    if (!tpl) {
      console.warn(`BaseComponent: template with id "${id}" not found.`);
      // still set templateFn to a resolver so future renders will pick it up if added to DOM
      this.templateFn = () => {
        const t = document.getElementById(
          this.templateId ?? ''
        ) as HTMLTemplateElement | null;
        return t ? t.innerHTML : '';
      };
      return;
    }
    this.templateFn = () => tpl.innerHTML;
    this.render();
  }

  /**
   * Lifecycle: component removed from DOM.
   *
   * Clears shadow DOM and internal binding state.
   */
  disconnectedCallback = (): void => {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
      this.initialized = false;
      this.bindings.clear();
      this.styleAdded.clear();
    }
  };

  /**
   * Lifecycle: component added to DOM.
   *
   * Triggers the initial render (a no-op if templateFn is not set).
   */
  connectedCallback(): void {
    this.render();
  }

  /**
   * Called when an observed attribute changes.
   *
   * Converts attribute strings to the existing prop type (number/boolean/string)
   * based on the current prop value type, updates this.props and updates bound
   * DOM nodes for that single attribute (no full re-render).
   *
   * Note: assignment preserves the proxy so bound updates happen as expected.
   *
   * @param name - Attribute name (also prop key)
   * @param oldValue - Previous attribute value
   * @param newValue - New attribute value
   */
  attributeChangedCallback(
    name: keyof TProps & string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue !== newValue) {
      const currentValue = this.props[name];
      const propType = typeof currentValue;
      let value: unknown = newValue;

      if (propType === 'number') value = Number(newValue);
      if (propType === 'boolean') value = newValue !== null;

      // assign into proxied props so proxy handler is preserved
      (this.props as Record<string, unknown>)[name] = value;

      // update only the bound nodes for this attribute (no full re-render)
      this.updateBindings(name);
    }
  }

  /**
   * Set a prop value and sync it to attributes.
   *
   * Assigns into the proxied props object so bound elements update automatically.
   *
   * @param key - Prop key
   * @param value - Prop value
   */
  protected setProp<K extends keyof TProps & string>(key: K, value: TProps[K]) {
    // assign via the proxied props so updateBindings runs automatically
    this.props[key] = value;
    if (typeof value === 'boolean') {
      if (value) this.setAttribute(key, '');
      else this.removeAttribute(key);
    } else {
      this.setAttribute(key, String(value));
    }
  }

  /**
   * Dispatch a typed custom event from the component.
   *
   * @param eventName - Event name
   * @param detail - Event detail payload
   */
  emit<K extends keyof TEvents & string>(eventName: K, detail: TEvents[K]): void {
    this.dispatchEvent(
      new CustomEvent(eventName, { detail, bubbles: true, composed: true })
    );
  }

  /**
   * Ensure styles (inline or external) are added to the shadowRoot once.
   */
  private ensureStyles(): void {
    if (!this.shadowRoot || !this.styles) return;

    for (const s of this.styles) {
      if (this.styleAdded.has(s)) continue;

      if (this.stylesIsPath.has(s)) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', s);
        this.shadowRoot.appendChild(link);
        this.styleAdded.add(s);
      } else {
        const styleEl = document.createElement('style');
        styleEl.textContent = s;
        this.shadowRoot.appendChild(styleEl);
        this.styleAdded.add(s);
      }
    }
  }

  /**
   * Render initial template and setup bindings. Subsequent calls will only
   * update bound nodes, avoiding re-creating the whole shadow DOM.
   *
   * First render:
   * - processes template HTML and replaces `{{prop}}` placeholders with
   *   <span data-bind="prop"></span> elements so they can be updated incrementally
   * - collects bound elements and sets their initial textContent from this.props
   * - binds actions
   *
   * Subsequent renders update all bound nodes from current this.props.
   */
  render(): void {
    if (!this.shadowRoot) return;
    if (!this.templateFn) return;

    if (!this.initialized) {
      // add styles before injecting content
      this.ensureStyles();

      // Replace mustache placeholders with data-bind spans so we can update them later
      const rawHtml = this.templateFn({ props: this.props });
      const processed = rawHtml.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
        return `<span data-bind="${key}"></span>`;
      });

      this.shadowRoot.innerHTML += processed;

      // collect bindings and set initial values
      const boundEls = this.shadowRoot.querySelectorAll<HTMLElement>('[data-bind]');
      boundEls.forEach((el) => {
        const key = el.getAttribute('data-bind');
        if (!key) return;
        if (!this.bindings.has(key)) this.bindings.set(key, []);
        this.bindings.get(key)!.push(el);
        const v = (this.props as Record<string, unknown>)[key];
        el.textContent = v == null ? '' : String(v);
      });

      this.bindActions();
      this.initialized = true;
    } else {
      // subsequent render: update all bound nodes from current props
      for (const [key, els] of this.bindings.entries()) {
        const v = (this.props as Record<string, unknown>)[key];
        for (const el of els) el.textContent = v == null ? '' : String(v);
      }
    }
  }

  /**
   * Update bound nodes for a specific prop (or all if no key provided).
   *
   * @param key - Optional prop key to update; updates all if omitted
   */
  protected updateBindings(key?: keyof TProps & string): void {
    if (!this.shadowRoot || !this.initialized) return;

    if (key) {
      const els = this.bindings.get(key as string) || [];
      const v = (this.props as Record<string, unknown>)[key as string];
      for (const el of els) el.textContent = v == null ? '' : String(v);
    } else {
      // update all
      for (const [k, els] of this.bindings.entries()) {
        const v = (this.props as Record<string, unknown>)[k];
        for (const el of els) el.textContent = v == null ? '' : String(v);
      }
    }
  }

  /**
   * Bind elements in the shadow DOM that have a `data-action` attribute.
   *
   * `data-action` format: "event:methodName[; event2:method2]".
   * Methods are looked up on the component instance and bound with `.bind(this)`.
   */
  bindActions(): void {
    if (!this.shadowRoot) return;
    const actionElements = this.shadowRoot.querySelectorAll<HTMLElement>('[data-action]');
    actionElements.forEach((el) => {
      const actions = el.dataset.action?.split(';') || [];
      actions.forEach((action) => {
        const [event, methodName] = action.split(':').map((s) => s.trim());
        const method = (this as Record<string, unknown>)[methodName];
        if (event && typeof method === 'function') {
          el.addEventListener(event, method.bind(this));
        } else {
          console.warn(
            `No method "${methodName}" found on component for action "${action}"`
          );
        }
      });
    });
  }
}
