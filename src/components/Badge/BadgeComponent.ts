import { BaseComponent } from '../BaseComponent';
import baseStyles from 'bundle-text:../../styles/base.css';
import styles from 'bundle-text:./BadgeComponent.css';
import templateHtml from 'bundle-text:./BadgeComponent.pug';

type Props = {
  width?: number;
  text?: string;
};

export class BadgeComponent extends BaseComponent<Props> {
  static observedAttributes = ['width', 'text'];

  constructor() {
    super(() => templateHtml, { width: 100, text: 'JB' }, [baseStyles, styles]);

    window.CSS.registerProperty({
      name: '--gradient-highlight',
      syntax: '<color>',
      initialValue: 'rgba(13, 110, 253, 0.3)',
      inherits: false,
    });

    window.CSS.registerProperty({
      name: '--gradient-opacity',
      syntax: '<number>',
      initialValue: '0.3',
      inherits: false,
    });

    window.CSS.registerProperty({
      name: '--outline-color',
      syntax: '<color>',
      initialValue: 'rgba(255, 255, 255, 0.6)',
      inherits: false,
    });
  }
}

customElements.define('badge-component', BadgeComponent);
