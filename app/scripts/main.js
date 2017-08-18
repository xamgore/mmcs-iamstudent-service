/* eslint-env browser */
(function() {
  'use strict';

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );

  if ('serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || isLocalhost)) {
    navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
      // updatefound is fired if service-worker.js changes.
      registration.onupdatefound = function() {
        // updatefound is also fired the very first time the SW is installed,
        // and there's no need to prompt for a reload at that point.
        // So check here to see if the page is already controlled,
        // i.e. whether there's an existing service worker.
        if (navigator.serviceWorker.controller) {
          // The updatefound event implies that registration.installing is set:
          // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
          var installingWorker = registration.installing;

          installingWorker.onstatechange = function() {
            switch (installingWorker.state) {
              case 'installed':
                // At this point, the old content will have been purged and the
                // fresh content will have been added to the cache.
                // It's the perfect time to display a "New content is
                // available; please refresh." message in the page's interface.
                break;

              case 'redundant':
                throw new Error('The installing ' +
                                'service worker became redundant.');

              default:
                // Ignore
            }
          };
        }
      };
    }).catch(function(e) {
      console.error('Error during service worker registration:', e);
    });
  }


  // extract data of the form
  const getFormData = inputs => {
    const getValue = node => ({ [node.name]: node.value })
    const raw = Object.assign(...inputs.map(getValue))
    return { ...raw, grade: +raw.grade, group: +raw.group, order: +raw.order }
  }


  const $ = s => document.querySelector(s)
  const $$ = s => Array.from(document.querySelectorAll(s))


  // save each change to the local storage
  const rawStore = window.localStorage.getItem('data')
  const store = rawStore && JSON.parse(rawStore)
  const inputs = $$('input, select')

  inputs.forEach(node => {
    if (store && store[node.name]) node.value = store[node.name]
    node.addEventListener('change', e => {
      window.localStorage.setItem('data', JSON.stringify(getFormData(inputs)))
    })
  })


  // change the admission when grade was selected
  const updateAdmission = grade => {
    const today = new Date().getFullYear()
    const yearsAgo = grade <= 4 ? grade : (grade - 4)
    const admission = new Date(today - yearsAgo, 8, 1)
    const isAutumn = new Date().getMonth() + 1 >= 9

    const year = admission.getFullYear() + isAutumn
    const month = (admission.getMonth() + 1).toString().padStart(2, '0')
    const day = (admission.getDate()).toString().padStart(2, '0')

    $('input[name=admission]').value = `${year}-${month}-${day}`
  }

  const $grade = $('select[name=grade]')
  $grade.addEventListener('change', e => updateAdmission(e.target.value))
  updateAdmission($grade.value)


  // catch form submition and send via ajax
  $('form').onsubmit = e => {
    e.preventDefault();

    axios.post('/', getFormData(inputs))
    .then(_ => document.location.href = '/ready.html')
    .catch(e => alert(e))
  }

})();
