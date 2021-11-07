$(window).load(function () {
  $(function () {
    barba.hooks.beforeOnce(() => {
      pageTransitiontwo()
    })

    // do something before the transition starts
    barba.hooks.before(() => {
      $('.target').removeClass('white')
      $('header.black').removeClass('black')
      $('html').removeClass('fixed-position')
      $('a').removeClass('active')
      tl.reverse()
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 2000)
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
            contentFadeIn('.fade-in-project', 'body', 70, 0, 100)
            contentFadeIn('.fade-in', 'body', 80, 0, 50)
            contentFadeIn('.fade-in-left', 'body', 80, -60, 0)
          },

          async once(data) {
            contentFadeIn('.fade-in-project', 'body', 70, 0, 100)
            contentFadeIn('.fade-in', 'body', 80, 0, 50)
            contentFadeIn('.fade-in-left', 'body', 80, -60, 0)
          },
        },
      ],
    })
  })
})