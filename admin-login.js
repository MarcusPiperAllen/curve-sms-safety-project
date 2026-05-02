if (new URLSearchParams(window.location.search).get('error') === '1') {
  document.getElementById('errorBanner').classList.add('visible');
}
