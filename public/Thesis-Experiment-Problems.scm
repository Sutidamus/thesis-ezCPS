(define (member?-cps item list continuation)
    (cond 
        [(null? list) (apply-k continuation #f)]
        [(eq? (car list) item) (apply-k continuation #t)]
        [else (member?-cps item (cdr list) continuation)]
    )
)