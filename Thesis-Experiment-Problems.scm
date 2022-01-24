;; Factorial-CPS - Easy
;; Took ~ 1min 30sec
(define factorial-cps (lambda (n k)
    (if (or (eq? n 1) (eq? n 0))
        (apply-k k 1)
        (factorial-cps (- n 1) (make-k (lambda (computed-fact)
            (* n computed-fact)
        )))
    ))
)


;; Problem 2 - Easy
(define member?-cps (lambda (item list k)
    (cond 
        [(null? list) (apply-k k #f)]
        [(eq? (car list) item) (apply-k k #t)]
        [else (member?-cps item (cdr list) k)]
    ))
)


;; Problem 3 - Easy/Medium
;; Roughly 5-10 min? (Didn't time)
(define (set?-cps ls k)
    (cond
        [(null? ls) (apply-k k #t)]
        [(not (pair? ls)) (apply-k k #f)]
        [else 
            (member?-cps (car ls) (cdr ls) 
                (make-k (lambda (isInCdr)
                    (if isInCdr 
                        (k #f)
                        (set?-cps (cdr ls) k)
                        ))))]))


;;

;;Problem 4 - Delete & Reverse, cons is substantial, append is substantial, reverse is substantial

;(deleteRev '(a b c d) 'b list) => ((d c a))

;;Given CPS versions of Procedures
(define (append-cps ls1 ls2 k)
    (apply-k k (append ls1 ls2))
)


(define (cons-cps el1 el2 k)
    (apply-k k (cons el1 el2))
)

(define (reverse-cps ls k)
    (apply-k k (reverse ls))
)


;; Medium problem 
;; 10min -15min ?
;; Students would be given an implementation of: append-cps, cons-cps
(define deleteRev 
    (lambda (el ls k)

        (let helper ((lst ls) (prev-els '()))
            (cond 
                [(null? lst) (apply-k k #f)]
                [(equal? (car lst) el)
                    (append-cps prev-els (cdr lst) 
                        (make-k (lambda (paired) 
                            (reverse-cps paired k )
                        ))
                    )
                ]
                [else 
                    (append-cps prev-els (list (car lst)) 
                        (make-k (lambda (appended)
                            (helper (cdr lst) appended)
                        ))
                    )
                ]
        )
        
        )
    )

)

;; Problem 5
;;InsertCorrectly - insert a num into its proper place in a list of numbers.
;; Took me 10-15min with some interruptions - Medium
;; Students would be given an implementation of: append-cps, cons-cps
(define insertCorrectly-cps
    (lambda (num ls k)
        (let helper ([prev-els '()])
                    ([lst ls])
            (cond
                [(null? lst) 
                    (append-cps prev-els (list num) k)]
                [(<= num (car lst)) 
                    (cons-cps num lst (make-k (lambda (cons-d) 
                                            (append-cps prev-els cons-d k))))]
                [else 
                    (append-cps prev-els (list (car lst)) (make-k (lambda (appended) 
                                                                (helper appended (cdr lst) k))))]
            )   
        )
    )
)

;; Problem 6
;; Insertion Sort CPS
;; Students would be given an implementation of insertCorrectly-cps
(define insertionSort-cps
    (lambda (ls k)
        (let helper ([sorted '()])
                    ([lst ls])
            (cond
                [(null? lst) (apply-k k sorted)]
                [else 
                    (insertCorrectly (car lst) sorted (make-k (lambda (newSorted) 
                                                            (helper newSorted (cdr lst)))))
                                                            ]))))