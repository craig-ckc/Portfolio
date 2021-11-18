const backgroundColor = '#f3f3f3'
const white = '#ffffff'
const blue = '#00ccff'
const black = '#0d0e0e'
const grey = '#c0c0c0'

function delay(n) {
  n = n || 2000
  return new Promise((done) => {
    setTimeout(() => {
      done()
    }, n)
  })
}

function pageTransitionIn() {
  var tl = gsap.timeline()
  // tl.set('.loading-container', { backgroundColor: "transparent", })
  tl.to('.loading-screen', {
    duration: 1,
    clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
    ease: 'Expo.easeInOut',
    delay: 0.3,
  })
  tl.set('.loading-screen', { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' })
}

function pageTransitionOut() {
  var tl = gsap.timeline()
  tl.to('.loading-screen', {
    duration: 1.2,
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    ease: 'Expo.easeInOut',
  })
  // tl.set('.loading-container', { backgroundColor: backgroundColor, })
}

function currentLink() {
  $('a').each(function () {
    if (
      (window.location.pathname.search($(this).attr('href')) != -1) &
      $(this).hasClass('target')
    ) {
      $('a').removeClass('active')
      $(this).addClass('active')
    }
  })
}

function copy() {
  var clipboard = new ClipboardJS('.js-copy')

  clipboard.on('success', function () {
    $('.js-copy p').text('Email copied')
  })
  clipboard.on('error', function () {
    $('.js-copy p').text('Email not copied')
  })
}

function intersectionAnim(targets_, trigger_, class_) {
  var targets = gsap.utils.toArray(targets_)

  try {
    var triggerDisTop = $(trigger_).position().top - $(window).scrollTop()
    var triggerDisBottom = triggerDisTop + 1.088 * $(trigger_).height()
  } catch (e) {
    $(targets_).removeClass(class_)
  }

  targets.forEach((target) => {
    var dis = target.getBoundingClientRect().top
    if (triggerDisTop <= dis && triggerDisBottom >= dis) {
      $(target).addClass(class_)
    } else {
      $(target).removeClass(class_)
    }
  })
}

function contentFadeIn(element, scrollWrap, location, left = 0, top = 0) {
  var sections = gsap.utils.toArray(element)

  sections.forEach((section) => {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        scroller: scrollWrap,
        start: `top ${location}%`,
      },
    })

    tl.from(section, {
      duration: 1,
      // ease: 'circ.out',
      x: left,
      y: top,
      opacity: 0,
    })
  })
}

$(window).scroll(() => {
  intersectionAnim('.target', '.dark-background', 'white')
  intersectionAnim('header', '.dark-background', 'black')
  intersectionAnim('header', '.project-header', 'transparent')
})

copy()
