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

   A reader who pauses a clip by hand stays paused: scrolling past and back does
   not overrule them. That is the whole reason for the byUs / userPaused pair. */

(function () {
  var clips = document.querySelectorAll('video[data-clip]');
  if (!clips.length) return;

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(clips, function (video) {
    if (reduced) {
      video.removeAttribute('autoplay');
      video.autoplay = false;
      video.loop = false;
      video.pause();
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
