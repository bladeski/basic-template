import { BaseComponent } from '../BaseComponent';
import baseStyles from 'bundle-text:../../styles/base.css';
import styles from 'bundle-text:./ExampleComponent.css';
import templateHtml from 'bundle-text:./ExampleComponent.pug';

type Props = {
  count: number;
  label?: string;
  active?: boolean;
};

type Events = {
  incremented: number;
  toggled: boolean;
};

export class ExampleComponent extends BaseComponent<Props, Events> {
  static observedAttributes = ['count', 'label', 'active'];

  constructor() {
    // pass the compiled HTML string as a template function
    super(() => templateHtml, { count: 0, label: 'Counter', active: false }, [
      baseStyles,
      styles,
    ]);
  }

  increment(): void {
    this.props.count += 1;
    this.emit('incremented', this.props.count);
  }

  toggle(): void {
    this.props.active = !this.props.active;
    this.emit('toggled', this.props.active);
  }
}

customElements.define('example-component', ExampleComponent);
