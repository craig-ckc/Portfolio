// Cursur animation Section - Open
var cursor = $('.cursor')
var point = $('.point')

TweenLite.set(cursor, {
  xPercent: -50,
  yPercent: -50,
})

TweenLite.set(point, {
  xPercent: -50,
  yPercent: -50,
})

function cursorAnim(e){
    TweenLite.to(cursor, 0.4, {
        x: e.clientX,
        y: e.clientY
    })

    TweenLite.to(point, 0.1, {
        x: e.clientX,
        y: e.clientY
    })
}

$(document).on("mousemove", function(e) {
  cursorAnim(e)
});

$("a").on("mousemove", function() {
    cursor.addClass("active");
    point.addClass("active");
});

$("a").on("mouseleave", function() {
    cursor.removeClass("active");
    point.removeClass("active");
});
// Cursur animation Section - Close

// Menu Open Animation Section - Open
var tl = gsap.timeline()

tl.to('.menu-bar', { duration: 0.01, width: '0%'})
.to('.public-nav .logo', { duration: 0.1, opacity: 0, y: -10})
.to('#mobile .main-nav', { duration: 0.5, delay: 0.5, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', })
.from('#mobile .main-nav .logo', { duration: 0.1, opacity: 0, y: -10})
.from('.menu-bar-close', {duration: 0.1, width: '0%'})
.from('.menu-bar-close', {duration: 0.1, delay: 0.3, rotation: 0,})
.from('#mobile .main-nav ul', {duration: 0.2, opacity: 0, y: 20, stagger: 0.2, ease: "circ.out"})
tl.reverse()


$(".menu-btn").on("click", function() {
  tl.reversed() ? tl.play() : tl.reverse();
  $('html').hasClass("fixed-position") ? $('html').removeClass("fixed-position") : $('html').addClass("fixed-position");
});
// Menu Open Animation Section - Close

// Menu Animation on Scroll Section - Open
const body = document.body;
let lastScroll = 0;

$(window).scroll(() => {
	const currentScroll = window.pageYOffset;
	if (currentScroll <= 0) {
		body.classList.remove("scroll-up");
		return;
	}

	if (currentScroll > lastScroll && !body.classList.contains("scroll-down")) {
		body.classList.remove("scroll-up");
		body.classList.add("scroll-down");
	} else if (
		currentScroll < lastScroll &&
		body.classList.contains("scroll-down")
	) {
		body.classList.remove("scroll-down");
		body.classList.add("scroll-up");
	}
	lastScroll = currentScroll;
})
// Menu Animation on Scroll Section - Close