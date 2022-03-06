import  SessionWorker  from  '~/assets/js/background.worker.js'

export  default (ctx, inject) => {
  inject('worker', {
    createWorker () {
      return new SessionWorker()
    }
  });
}