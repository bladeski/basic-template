import type { compileTemplate } from 'pug';

export abstract class BaseComponent<
  TProps extends Record<string, unknown> = Record<string, never>,
  TEvents = Record<string, never>,
> extends HTMLElement {
  static observedAttributes: string[] = [];

  props = {} as TProps;
  private templateFn?: (locals?: { props: TProps }) => string;

  constructor(templateFn?: (locals?: { props: TProps }) => string) {
    super();
    this.attachShadow({ mode: 'open' });
    this.templateFn = templateFn;
  }

  connectedCallback(): void {
    this.render();
  }

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

      this.props = { ...this.props, [name]: value } as TProps;
      this.render();
    }
  }

  protected setProp<K extends keyof TProps & string>(key: K, value: TProps[K]) {
    this.props[key] = value;
    if (typeof value === 'boolean') {
      if (value) this.setAttribute(key, '');
      else this.removeAttribute(key);
    } else {
      this.setAttribute(key, String(value));
    }
  }

  emit<K extends keyof TEvents & string>(
    eventName: K,
    detail: TEvents[K]
  ): void {
    this.dispatchEvent(
      new CustomEvent(eventName, { detail, bubbles: true, composed: true })
    );
  }

  render(): void {
    if (!this.shadowRoot) return;

    if (this.templateFn) {
      const html = this.templateFn({ props: this.props });
      this.shadowRoot.innerHTML = html;
      this.bindActions();
    }
  }

  bindActions(): void {
    if (!this.shadowRoot) return;
    const actionElements =
      this.shadowRoot.querySelectorAll<HTMLElement>('[data-action]');
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
