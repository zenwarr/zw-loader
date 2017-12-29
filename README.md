# What is it?

A helper library for loading data from remote source to a DOM element.

# Installing

```
npm i --save @zcomp/loader
```

# Usage

```javascript
const loader = require('@zcomp/loader');
loader.LoaderFactory.init();
```

```html
<div class="js-load" data-load="http://example.com/partial.html">
  <div class="js-load__content"></div>
  <div class="js-load__error"></div>
</div>
```

Here a HTML file located at given url will be loaded into `js-load__content` element.
`js-load__content` element is optional.
If there are no `js-load__content` child of `js-load` element, the loaded content will replace entire contents of `js-load`.
If error is occupied during loading content, `js-load__error` will contain error message.

The content is not loaded automatically or on any event.
You should manually call `loader.load` method when you need to load content.

## `data-load-plaintext`

If root element has this attribute, loaded content will be treated as plain text (e.g., `textContent` will be used to set element value).
You can set `plainText` property on options object to make all components to be plaintext by default.

## Custom loader

Use `loader` property to set custom content loader:

```javascript
LoaderFactory.init({
  loader: (url, done, component) => {
    // load data...
    if (err) {
      // on error
      done(err, null);
    } else {
      done(null, "loaded content");
    }
  }
});
```

## Custom apply method

Use `applier` property to intercept process of applying content to element:

```javascript
LoaderFactory.init({
  applier: (component, content, done) => {
    if (component.plainText) {
      component.contentElement.textContent = content;
    } else {
      component.contentElement.innerHTML = content;
    }
  }
})
```

## Instant load timeout

To make interface look smooth, you can set `instantLoadTimeout` option.
It can be useful when you want to display some loading animation, but not when network is fast and you can load assets in a blink of an eye.
If you set this option, `loading` state will only be set if loading take longer than specified time.

