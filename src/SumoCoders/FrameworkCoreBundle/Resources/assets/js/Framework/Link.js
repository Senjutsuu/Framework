export class Link {
  constructor () {
    this.initLink()
  }
  
  initLink () {
    $('a.confirm').on('click', $.proxy(this.askConfirmation, this))
    $('button.confirm').on('click', $.proxy(this.askConfirmationAndSubmit, this))
  }

  askConfirmation (event) {
    event.preventDefault()
    let $this = $(event.currentTarget)

    $('#confirmModalOk').attr('href', $this.attr('href'))
    $('#confirmModalMessage').html($this.data('message'))
    $('#confirmModal').modal('show')
  }

  askConfirmationAndSubmit (event) {
    event.preventDefault()
    let $this = $(event.currentTarget)
    let $modal = $('#confirmModal')
    let $form = $this.parents('form')

    $('#confirmModalMessage').html($this.data('message'))

    $modal.on('click', '#confirmModalOk', (event) => {
      event.preventDefault()
      $form.submit()
    })

    $modal.modal('show')

    $modal.on('hide', () => {
      $modal.off('click', '#confirmModalOk')
    })
  }
}
