import { expect } from 'chai';
import {ChangeStateEvent, DefaultOptions, Loader, LoaderFactory, LoadState} from "./index";

function init(html: string): void {
  document.body.innerHTML = html;
}

function elem(id: string): Element {
  return document.getElementById(id) as Element;
}

function sendEvent(id: string, eventType: string): void {
  elem(id).dispatchEvent(new Event(eventType, { bubbles: true }));
}

function hasClass(id: string, className: string): boolean {
  return elem(id).classList.contains(className);
}

describe("Loader", function () {
  it('should create component', function () {
    init(`<div class="js-load" id="load"></div>`);

    let loader = LoaderFactory.createComp(Loader, elem('load'));
    expect(loader).to.not.be.null;
    expect(loader.loadState).to.be.equal(LoadState.NotLoaded);
    expect(loader.url).to.be.null;
    expect(loader.plainText).to.be.false;
  });

  it('should set url', function () {
    init(`<div class="js-load" data-load="http://example.com/" id="load"></div>`);

    let loader = LoaderFactory.createComp(Loader, elem('load'));
    expect(loader.url).to.be.equal('http://example.com/');
    loader.url = 'some url';
    expect(loader.url).to.be.equal('some url');
    expect(loader.root.classList.contains(DefaultOptions.notLoadedClass || '')).to.be.true;
  });

  it('should load', function () {
    init(`<div class="js-load" data-load="res_id" id="load"></div>`);

    let loader = LoaderFactory.createComp(Loader, elem('load'), {
      loader: (url, cb, component) => {
        expect(loader.loadState).to.be.equal(LoadState.Loading);
        expect(url).to.be.equal('res_id');
        expect(cb).to.not.be.null;
        expect(component).to.be.equal(loader);
        cb(null, 'some response');
      },
      instantLoadTimeout: 0
    });
    loader.load();
    expect(loader.loadState).to.be.equal(LoadState.Loaded);
  });

  it('should not load twice', function () {
    init(`<div class="js-load" data-load="res_id" id="load"></div>`);

    let loader = LoaderFactory.createComp(Loader, elem('load'), {
      loader: (url, cb, component) => {
        cb(null, 'some response');
      },
      instantLoadTimeout: 0
    });

    let fireCount = 0;
    loader.root.addEventListener(DefaultOptions.loadStateChangedEvent || '', () => ++fireCount);

    loader.load();
    expect(loader.loadState).to.be.equal(LoadState.Loaded);
    expect(fireCount).to.be.equal(2);

    loader.load();
    expect(fireCount).to.be.equal(2);
    expect(loader.loadState).to.be.equal(LoadState.Loaded);
  });

  it('should reload', function () {
    init(`<div class="js-load" data-load="res_id" id="load"></div>`);

    let loaderCallCount = 0;
    let loader = LoaderFactory.createComp(Loader, elem('load'), {
      loader: (url, cb, component) => {
        if (loaderCallCount > 0) {
          cb(null, 'second response');
        } else {
          cb(null, 'some response');
        }
        ++loaderCallCount;
      },
      instantLoadTimeout: 0
    });

    let fireCount = 0;
    loader.root.addEventListener(DefaultOptions.loadStateChangedEvent || '', () => ++fireCount);

    loader.load();
    expect(loader.loadState).to.be.equal(LoadState.Loaded);
    expect(fireCount).to.be.equal(2);

    loader.reload();
    expect(loader.loadState).to.be.equal(LoadState.Loaded);
    expect(fireCount).to.be.equal(4);
    expect(elem('load').textContent).to.be.equal('second response');
  });

  it('should fire events', function () {
    init(`<div class="js-load" data-load="res_id" id="load"></div>`);

    let loader = LoaderFactory.createComp(Loader, elem('load'), {
      loader: (url, cb) => cb(null, 'some response'),
      instantLoadTimeout: 0
    });
    let fireCount = 0;
    let states: LoadState[] = [ ];
    loader.root.addEventListener(DefaultOptions.loadStateChangedEvent || '', (e: ChangeStateEvent) => {
      ++fireCount;
      states.push(e.detail.newState);
    });
    loader.load();
    expect(fireCount).to.be.equal(2);
    expect(states).to.be.deep.equal([ LoadState.Loading, LoadState.Loaded ]);
    expect(elem('load').innerHTML).to.be.equal('some response');
  });

  it('should set error', function () {
    init(`<div class="js-load" data-load="res_id" id="load">
      <div class="js-load__error" id="error"></div>
    </div>`);

    let loader = LoaderFactory.createComp(Loader, elem('load'), {
      loader: (url, cb) => cb(new Error('error text'), null)
    });
    loader.load();
    expect(loader.loadState).to.be.equal(LoadState.LoadError);
    expect(elem('error').innerHTML).to.be.equal('error text');
    expect(loader.root.classList.contains('js-load--error')).to.be.true;
  });

  it('should handle nested loaders', function () {
    init(`<div class="js-load" data-load="res_id" id="load">
      <div class="js-load">
        <div class="js-load__content" id="load-content-nested"></div>
      </div>
      <div class="js-load__content" id="load-content"></div>
    </div>`);

    LoaderFactory.init({
      loader: (url, cb) => cb(null, 'loaded content')
    });
    let loader = LoaderFactory.fromRoot(elem('load')) as Loader;
    loader.load();
    expect(elem('load-content').textContent).to.be.equal('loaded content');
    expect(elem('load-content-nested').textContent).to.be.equal('');
  });

  it('should handle nested loaders (errors)', function () {
    init(`<div class="js-load" data-load="res_id" id="load">
      <div class="js-load">
        <div class="js-load__error" id="load-error-nested"></div>
      </div>
      <div class="js-load__error" id="load-error"></div>
    </div>`);

    LoaderFactory.init({
      loader: (url, cb) => cb(new Error('error text'), null)
    });
    let loader = LoaderFactory.fromRoot(elem('load')) as Loader;
    loader.load();
    expect(elem('load-error').textContent).to.be.equal('error text');
    expect(elem('load-error-nested').textContent).to.be.equal('');
  });
});
