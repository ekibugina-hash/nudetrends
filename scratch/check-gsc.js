fetch('https://nudetrends.afrozex.com')
  .then(res => res.text())
  .then(text => {
    if (text.includes('google-site-verification')) {
      console.log('Found GSC tag!');
    } else {
      console.log('GSC tag not found!');
    }
  });
