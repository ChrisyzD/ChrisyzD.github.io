/* The only JavaScript on this site. It exists for two things a video element
   cannot do for itself, and the page is fully usable without it: with the file
   blocked, both clips still autoplay and both can still be paused with their
   native controls.

   1. prefers-reduced-motion. A muted looping clip is motion, and CSS has no way
      to stop autoplay. Readers who asked their OS for less of it get the poster
      frame and a play button instead — which for both clips is the frame that
      carries the point anyway.
   2. Off-screen clips pause. A 25-second loop running three thousand pixels
      above the reader spends a phone battery for nobody.
   3. Both clips are 1280px screen recordings. Below 900px they render at 27% and
      nothing inside them resolves, so below 900px neither starts itself: the reader
      gets the poster — for MetaFlow the last step, all provenance checks green; for
      the EMG loop the reaching canvas with its counter — and taps to play. Marked
      in the HTML with data-tap, because that is a fact about those clips' contents,
      not a rule about videos. It is also what keeps the "no animation on this site"
      claim true on the device most likely to arrive here. On those same narrow
      screens the poster is shown with no player chrome on top of it, because a
      40px control bar over a 127px still covers the part worth seeing; the
      controls come back the moment it is playing.

   A reader who pauses a clip by hand stays paused: scrolling past and back does
   not overrule them. That is the whole reason for the byUs / userPaused pair. */

(function () {
  var clips = document.querySelectorAll('video[data-clip]');
  if (!clips.length) return;

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow  = window.matchMedia &&
                window.matchMedia('(max-width: 899px)').matches;

  // A phone renders the EMG clip at 350x127. The browser's own control bar is
  // about 40px tall — 31% of that — and it sits along the bottom edge, which on
  // that clip is the reaching band: the yellow cursor, the target going green,
  // the counter ticking over. The one region of a three-region composite that
  // carries the argument was under the player's furniture, in the still a phone
  // reader is shown before anything has been asked to play. Until it is playing
  // there is nothing to control, so there are no controls: the poster is the
  // target, one tap starts it, and the controls come back at that moment so it
  // can still be stopped. Without this file the controls are simply there, which
  // is worse-looking and still works.
  function tapToPlay(video) {
    video.removeAttribute('controls');
    video.controls = false;
    video.style.cursor = 'pointer';
    video.tabIndex = 0;
    var start = function (e) {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e.type === 'keydown') e.preventDefault();
      video.removeEventListener('click', start);
      video.removeEventListener('keydown', start);
      video.style.cursor = '';
      video.controls = true;
      video.loop = true;
      var started = video.play();
      if (started && started.catch) started.catch(function () {});
    };
    video.addEventListener('click', start);
    video.addEventListener('keydown', start);
  }

  Array.prototype.forEach.call(clips, function (video) {
    if (reduced || (narrow && video.hasAttribute('data-tap'))) {
      video.removeAttribute('autoplay');
      video.autoplay = false;
      video.loop = false;
      video.pause();
      if (narrow && video.hasAttribute('data-tap')) tapToPlay(video);
      return;
    }

    if (!('IntersectionObserver' in window)) return;

    var userPaused = false;   // the reader hit pause
    var byUs = false;         // this script hit pause

    video.addEventListener('pause', function () {
      if (byUs) { byUs = false; return; }
      userPaused = true;
    });
    video.addEventListener('play', function () { userPaused = false; });

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (userPaused || !video.paused) return;
          var started = video.play();
          if (started && started.catch) started.catch(function () {});
        } else if (!video.paused) {
          byUs = true;
          video.pause();
        }
      });
    }, { threshold: 0.15 }).observe(video);
  });
})();
