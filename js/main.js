$(function () {
  // do something before the transition starts
  barba.hooks.before(() => {
    $('.target').removeClass('white')
    $('header.black').removeClass('black')
    $('html').removeClass("fixed-position")
    $('a').removeClass('active')
    tl.reverse();
  })

  // do something after the transition finishes
  barba.hooks.after(() => {
    intersectionAnim('.target', '.dark-background')
  })

  // scroll to the top of the page
  barba.hooks.enter(() => {
    window.scrollTo(0, 0)
  })

  barba.init({
    sync: true,

    transitions: [
      {
        async leave(data) {
          const done = this.async()
          pageTransitionOne()
          await delay(1000)
          done()
        },

        async enter(data) {
          currentLink()
        },
        
        async once(data) {
        },
      },
    ],
  })
})





