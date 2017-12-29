import * as base from "@zcomp/base";

export type LoadDoneCallback = (err: Error|null, data: string|null) => void;
export type LoadCallback = (url: string, done: LoadDoneCallback, component: Loader) => void;
export type ApplyDoneCallback = (err: Error|null) => void;
export type ApplyCallback = (component: Loader, content: string|null, done: ApplyDoneCallback) => void;

export enum LoadState {
  NotLoaded = 0,
  Loading,
  Loaded,
  LoadError
}

export interface LoaderOptions extends base.ComponentOptions {
  /**
   * Custom loader
   */
  loader?: LoadCallback;

  /**
   * Timeout to be used for async requests
   */
  requestTimeout?: number;

  /**
   * Class to add when component is in not-loaded state
   */
  notLoadedClass?: string;

  /**
   * Class to add when component is in loading state
   */
  loadingClass?: string;

  /**
   * Class to add when component is in loaded state
   */
  loadedClass?: string;

  /**
   * Class to add when loading failed
   */
  loadErrorClass?: string;

  /**
   * Selector for element where error message will be displayed
   */
  errorSelector?: string;

  /**
   * Timeout after which component should go into loading state
   */
  instantLoadTimeout?: number;

  /**
   * Name of event fired when state changes
   */
  loadStateChangedEvent?: string;

  /**
   * Attribute containing url
   */
  urlAttr?: string;

  /**
   * Custom apply routine
   */
  applier?: ApplyCallback;

  /**
   * Attribute for marking plain-text components
   */
  plainTextAttr?: string;

  /**
   * Whether components should be plain-text by default
   */
  plainText?: boolean;

  /**
   * Selector for element which children will be replaced by content
   */
  contentSelector?: string;
}

export const DefaultOptions: LoaderOptions = {
  rootSelector: '.js-load',
  requestTimeout: 20 * 1000,
  notLoadedClass: 'js-load--not-loaded',
  loadingClass: 'js-load--loading',
  loadedClass: 'js-load--loaded',
  loadErrorClass: 'js-load--error',
  errorSelector: '.js-load__error',
  loadStateChangedEvent: 'load-state-changed',
  instantLoadTimeout: 300,
  urlAttr: 'data-load',
  plainTextAttr: 'data-load-plain-text',
  plainText: false,
  contentSelector: '.js-load__content',
  loader: (url: string, done: LoadDoneCallback, component: Loader): void => {
    let request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.timeout = component.options.requestTimeout || 20 * 1000;
    request.onreadystatechange = () => {
      if (request.readyState !== XMLHttpRequest.DONE) {
        return;
      }

      if (request.status !== 200) {
        done(new Error(request.statusText), null);
      } else {
        done(null, request.responseText);
      }
    };
    request.send();
  }
};

export interface ChangeStateEvent extends CustomEvent {
  detail: {
    newState: LoadState
  }
}

export class Loader extends base.Component<LoaderOptions> {
  constructor(root: Element, options: LoaderOptions) {
    super(root, options);

    if (!this.options.urlAttr) {
      throw new Error('urlAttr option is empty');
    }

    this._plainText = base.checkBinaryOptionAttr(this.root, this.options.plainTextAttr, this.options.plainText || false);

    this._syncClasses();
  }

  get plainText(): boolean { return this._plainText; }

  get loadState(): LoadState {
    return this._state;
  }

  load(): void {
    if (!this.options.loader) {
      throw new Error('Cannot load content: loader option is empty');
    }

    if (!this.url) {
      this._setState(LoadState.Loaded);
      return;
    }

    if (this.options.instantLoadTimeout != null && this.options.instantLoadTimeout > 0) {
      setTimeout(() => {
        if (this._state === LoadState.NotLoaded) {
          this._setState(LoadState.Loading);
        }
      }, 0);
    } else {
      this._setState(LoadState.Loading);
    }

    this.options.loader(this.url, (err, content) => {
      if (err) {
        this._setError(err);
        return;
      }

      if (this.options.applier) {
        this.options.applier(this, content, (err) => {
          if (err) {
            this._setError(err);
          } else {
            this._setState(LoadState.Loaded);
          }
        });
      } else {
        this.applyContent(content || '');
        this._setState(LoadState.Loaded);
      }
    }, this);
  }

  get url(): string|null {
    if (this.options.urlAttr) {
      return this.root.getAttribute(this.options.urlAttr) || null;
    } else {
      return null;
    }
  }

  set url(value: string|null) {
    if (!this.options.urlAttr) {
      return;
    }

    if (!value) {
      this.root.removeAttribute(this.options.urlAttr);
    } else {
      this.root.setAttribute(this.options.urlAttr, value || '');
    }
  }

  get contentElement(): Element {
    if (this.options.contentSelector) {
      let elem = this.root.querySelector(this.options.contentSelector);
      if (elem) {
        return elem;
      }
    }
    return this.root;
  }

  applyContent(content: string): void {
    if (this._plainText) {
      this.contentElement.textContent = content;
    } else {
      this.contentElement.innerHTML = content;
    }
  }

  /** Protected area **/

  protected _state: LoadState = LoadState.NotLoaded;
  protected _plainText: boolean = false;

  protected _setState(state: LoadState): void {
    this._state = state;

    this._syncClasses();

    if (this.options.loadStateChangedEvent) {
      this.root.dispatchEvent(new CustomEvent(this.options.loadStateChangedEvent, {
        bubbles: true,
        cancelable: false,
        detail: {
          newState: this._state
        }
      } as ChangeStateEvent));
    }
  }

  protected _syncClasses(): void {
    this.root.classList.toggle(this.options.notLoadedClass || '', this._state === LoadState.NotLoaded);
    this.root.classList.toggle(this.options.loadedClass || '', this._state === LoadState.Loaded);
    this.root.classList.toggle(this.options.loadingClass || '', this._state === LoadState.Loading);
    this.root.classList.toggle(this.options.loadErrorClass || '', this._state === LoadState.LoadError);
  }

  protected _setError(err: Error): void {
    this._setState(LoadState.LoadError);

    if (this.options.errorSelector) {
      let errElems = this.root.querySelectorAll(this.options.errorSelector);
      for (let q = 0; q < errElems.length; ++q) {
        errElems[q].textContent = err.message;
      }
    }
  }
}

export const LoaderFactory = new base.ComponentFactory('loader', DefaultOptions, Loader);
