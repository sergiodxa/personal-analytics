# personal-analytics

A microservice used for the analytics of my site.

## Usage

The API only expose a single method under `/` (technically the pathname doesn't matter).

Each request is an action which will be simple logged in the terminal for future reference.

### Endpoint

Send a request to `/` with the following querystring options:

* `action` (string) the action performed by the user (required)
* `description` (string) an string with more information (default empty)
* `type` (string) an string indicating the type of action, it can be `event`, `info`, `warning` or `error` (default event)

### JavaScript

You can use it from JS easily with a few lines:

```js
await fetch("https://analytics.sergiodxa.com?action=Test%20request&description=This%20is%20just%20a%20test");
```

### CSS

Yes, you can even use it with pure CSS. Just add something like this:

```css
a:active {
  background: url("https://analytics.sergiodxa.com?action=Link%20clicked");
}
```

You can't however do dynamic descriptions, but this will let you setup a basic analytics without requiring CSS for basic features.
