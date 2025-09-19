export abstract class BaseComponent<
  TProps extends PropTypes = {},
  TEvents = {}
> extends HTMLElement implements BaseComponent<TProps, TEvents> {
  static observedAttributes: string[] = [];

  props = {} as TProps;
  templateId?: string;

  constructor(templateId?: string) {
    super();
    this.attachShadow({ mode: 'open' });
    this.templateId = templateId;
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    // Cleanup logic here
  }

  attributeChangedCallback(
    name: keyof TProps & string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue !== newValue) {
      const propType = typeof (this.props as any)[name];
      let value: any = newValue;
      if (propType === 'number') value = Number(newValue);
      if (propType === 'boolean') value = newValue !== null;
      (this.props as any)[name] = value;
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

  emit<K extends keyof TEvents & string>(eventName: K, detail: TEvents[K]): void {
    this.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true, composed: true }));
  }

  render(): void {
    if (!this.shadowRoot) return;

    if (this.templateId) {
      const template = document.getElementById(this.templateId) as HTMLTemplateElement | null;
      if (template && template.content) {
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.bindActions();
      } else {
        console.warn(`Template with id "${this.templateId}" not found.`);
      }
    }
  }

  bindActions(): void {
    if (!this.shadowRoot) return;
    const actionElements = this.shadowRoot.querySelectorAll<HTMLElement>('[data-action]');
    actionElements.forEach(el => {
      const actions = el.dataset.action?.split(';') || [];
      actions.forEach(action => {
        const [event, methodName] = action.split(':').map(s => s.trim());
        const method = (this as any)[methodName];
        if (event && typeof method === 'function') {
          el.addEventListener(event, method.bind(this));
        } else {
          console.warn(`No method "${methodName}" found on component for action "${action}"`);
        }
      });
    });
  }
}
