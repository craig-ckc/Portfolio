
function insert(file, elemnt) {
  $.get(
    `/modules/${file}.txt`,
    function (data) {
      $(`.${elemnt}-placeholder`).replaceWith(data)
    },
    'text',
  )
}


insert('header', 'header')
insert('footer', 'footer')

console.log("insert method")