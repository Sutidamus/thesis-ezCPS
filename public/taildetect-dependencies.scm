 ;; Useful functions

; Procedures to make the parser a little bit saner.
(define 1st car)
(define 2nd cadr)
(define 2rest cdr)
(define 3rd caddr)
(define 3rest cddr)
(define 4th cadddr)
(define 4rest cdddr)

(define list-of
  (lambda (pred . l)
    (let ((all-preds (cons pred l)))
      (lambda (obj)
        (let loop ((obj obj) (preds '()))
          (or 
            ;; if list is empty, preds should be, too
            (and (null? obj) (null? preds))
            (if (null? preds)
                ;; if preds is empty, but list isn't, then recycle
                (loop obj all-preds)
                ;; otherwise check and element and recur.
                (and (pair? obj)
                     ((car preds) (car obj))
                     (loop (cdr obj) (cdr preds))))))))))

;; Type checking classes - will be used when checking type of expression
(define instance-of-type (lambda (class-Type)
                             (lambda (inst)
                                 (instanceof class-Type inst)
                                 )
                             ))




;;===================
;;===================
;; EXPRESSION TYPES
;;===================
;;===================
(define-class Expression nil
    (constructor (lambda (self)))
              )

(define Expression?? (instance-of-type Expression))

(define-class lit-exp Expression
    (constructor (lambda (self datum)
        (if (or (null? datum) (number? datum) (pair? datum) (vector? datum) (boolean? datum) (string? datum) (symbol? datum))
            (set-obj! self 'datum datum)
            (. console log "Failed to create lit-exp ::")
        )
    )
    ))

(define-class var-exp Expression
    (constructor (lambda (self id)
                     (if (symbol? id)
                         (set-obj! self 'id id)
                         (. console log "Failed to create var-exp")
                         )
                     )
                 )
              )
(define-class lambda-exp Expression
    (constructor (lambda (self vars bodies)
                     (cond
                        [(not (list-of symbol? vars)) (console.log "Failed to create lambda-exp :: vars not a list of symbols")]
                        [(not (list-of Expression?? bodies)) (console.log "Failed to create lambda-exp :: bodies not a list of expressions")]
                        [else
                            (begin
                                (set-obj! self 'vars vars)
                                (set-obj! self 'bodies bodies)
                            )
                        ]
                     )
                     )
                 )
              )

(define-class if-exp Expression
    (constructor (lambda (self test-exp then-exp else-exp)
                     (cond
                        [(not (Expression?? test-exp)) (console.log "Failed to create if-exp :: test-exp not an expression")]
                        [(not (Expression?? then-exp)) (console.log "Failed to create if-exp :: then-exp not an expression")]
                        [(not (Expression?? else-exp)) (console.log "Failed to create if-exp :: then-exp not an expression")]
                        [else
                            (begin
                                (set-obj! self 'test-exp test-exp)
                                (set-obj! self 'then-exp then-exp)
                                (set-obj! self 'else-exp else-exp)
                            )
                        ]
                     )
                     )
                 )
              )

(define-class let-exp Expression
    (constructor (lambda (self vars var-exps bodies)
                    (cond 
                        [(not (list-of symbol? vars)) (. console log "Failed to create let-exp:: vars not a list of symbols")]
                        [(not (list-of Expression?? var-exps)) (. console log "Failed to create let-exp:: var-exps not a list of expresssions")]
                        [(not (list-of Expression?? bodies)) (. console log "Failed to create let-exp:: bodies not a list of expresssions")]
                        [else
                            ( begin
                                (set-obj! self 'vars vars)
                                (set-obj! self 'var-exps var-exps)
                                (set-obj! self 'bodies bodies)
                            )
                        ]
                    )
                    )
                 )
              )

(define-class app-exp Expression
    (constructor (lambda (self rator rands)
                    (console.log "Rator: " rator)
                     (cond
                        [(not (Expression?? rator)) (console.log "Failed to create app-exp :: rator not an expression")]
                        [(not (list-of Expression?? rands)) (console.log "Failed to create app-exp :: rands not a list of expressions")]
                        [else
                            (begin
                                (set-obj! self 'rator rator)
                                (set-obj! self 'rands rands)
                            )
                        ]
                     )
                     )
                 )
              )

(define-class if-only-exp Expression
    (constructor (lambda (self test-exp then-exp)
        (cond
            [(not (Expression?? test-exp))(console.log "Failed to create if-exp :: test not an expression")]
            [(not (Expression?? then-exp))(console.log "Failed to create if-exp :: then-exp not an expression")]
            [else
                (begin
                    (set-obj! self 'test-exp test-exp)
                    (set-obj! self 'then-exp then-exp)
                )
            ]
        )
    
    ))

)

(define-class let-named-exp Expression
            (constructor (lambda (self proc-id ids init-vals bodies)
                            (cond 
                                [(and (not (symbol? proc-id)) (not (string? proc-id))) (. console log "Failed to create let-named-exp:: proc-id not a symbol")]
                                [(not (list-of symbol? ids)) (. console log "Failed to create let-named-exp:: ids not a list of symbols")]
                                [(not (list-of Expression?? init-vals)) (. console log "Failed to create let-named-exp:: init-vals not a list of expressions")]
                                [(not (list-of Expression?? bodies)) (. console log "Failed to create let-named-exp:: bodies not a list of expresssions")]
                                [else
                                    ( begin
                                        (set-obj! self 'proc-id proc-id)
                                        (set-obj! self 'ids ids)
                                        (set-obj! self 'init-vals init-vals)
                                        (set-obj! self 'bodies bodies)
                                    )
                                ]
                            )
                            )
                         )
)

;;===================
;;===================
;;  TYPE CHECKING
;;===================
;;===================

(define lit-exp? (instance-of-type lit-exp))
(define var-exp? (instance-of-type var-exp))
(define lambda-exp? (instance-of-type lambda-exp))
(define let-exp? (instance-of-type let-exp))
(define app-exp? (instance-of-type app-exp))
(define if-exp? (instance-of-type if-exp))
(define if-only-exp? (instance-of-type if-only-exp))
(define let-named-exp? (instance-of-type let-named-exp))

;;===================
;;===================
;; PARSE EXPRESSION
;;===================
;;===================

(define parse-exp 
    (lambda (datum)
    ; (console.log datum)
    ; (console.log (type datum))
    ; (console.log datum)
    (cond
        [(symbol? datum) (new var-exp datum)]
        [(number? datum) (new lit-exp datum)]
        [(boolean? datum) (new lit-exp datum)]
        [(pair? datum) 
            (let ([pair-type-id (car datum)])
                (cond
                    [(equal? pair-type-id 'lambda) 
                        (new lambda-exp (2nd datum) (map parse-exp (cddr datum)))]
                    [(or (equal? pair-type-id 'let) (equal? pair-type-id 'letrec) (equal? pair-type-id 'let*))
                        (let ([var-pairs (2nd datum)]
                              [bodies (cddr datum)])
                                (if (or (symbol? (2nd datum)) (string? (2nd datum)))
                                    (new let-named-exp 
                                        (2nd datum) 
                                        (map 1st (3rd datum))
                                        (map parse-exp (map 2nd (3rd datum)))
                                        (map parse-exp (4rest datum))
                                    )
                                    (new let-exp (map 1st var-pairs) 
                                            (map parse-exp (map 2nd var-pairs)) 
                                            (map parse-exp bodies)
                                    )
                                )
                              )
                    ]
                    [(equal? pair-type-id 'if)
                        (if (null? (4rest datum))
                            (new if-only-exp (parse-exp (2nd datum)) (parse-exp (3rd datum)))
                            (new if-exp 
                                (parse-exp (2nd datum))
                                (parse-exp (3rd datum))
                                (parse-exp (4th datum))
                            )
                        )
                    ]
                    [else
                        (new app-exp (parse-exp (1st datum))
                                     (map parse-exp (cdr datum)))
                    ]
                )
            
            )
        ]
        [else (console.log "Error in parse-exp, bad expression")]
    ))
)

(define (syntax-expand exp)
    (cond
        [(lambda-exp? exp) (new lambda-exp exp.vars (syntax-expand exp.bodies))]
        [(let-exp? exp) (new let-exp exp.vars (map syntax-expand exp.var-exps) (map syntax-expand exp.bodies))]
        [(let-named-exp? exp) (new let-named-exp exp.proc-id exp.ids (map syntax-expand exp.init-vals) (map syntax-expand exp.bodies))]
        [(lit-exp? exp) exp]
        [(var-exp? exp) exp]
        [(if-only-exp? exp) (new if-only-exp (syntax-expand exp.test-exp) (syntax-expand exp.then-exp) )]
        [(if-exp? exp) (new if-exp (syntax-expand exp.test-exp) (syntax-expand exp.then-exp) (syntax-expand exp.else-exp))] 
        [(app-exp? exp)
            (if (var-exp? exp.rator)
                (cond 
                    [(equal? exp.rator.id "cond") (cond-parse exp.rands)]
                    [(equal? exp.rator.id "case") (case-parse (car exp.rands) (cdr exp.rands))]
                    [(equal? exp.rator.id "or") (if (null? exp.rands)
                       (new lit-exp #f)
                       (if (null? (cdr exp.rands))
                           (syntax-expand (car exp.rands))
                           (new if-exp (syntax-expand (car exp.rands))
                             (syntax-expand (car exp.rands))
                             (syntax-expand 
                               (new app-exp 
                                 (new var-exp 'or)
                                 (cdr exp.rands))))))]
                    [else (new app-exp exp.rator (map syntax-expand exp.rands))]
                )
                exp
            )
            
            
        ]
        [else exp]
    
    )
)

(define (cond-parse cond-app-rand)
    (console.log "Starting cond-parse")
    (if (null? cond-app-rand) 
        (new app-exp (new var-exp 'void) '())
        (let ([c (car cond-app-rand)])
            (cond 
                [(app-exp? c)
                    (if 
                        (if (var-exp? c.rator)
                            (equal? c.rator.id "else")
                            #f
                        )
                    (new app-exp (new lambda-exp '() (map syntax-expand c.rands)) '())
                    (new if-exp (syntax-expand c.rator)
                        (new app-exp (new lambda-exp '() (map syntax-expand c.rands)) '())
                        (cond-parse (cdr cond-app-rand))
                    )
                    )
                ]
                [else (console.log "Error in syntax-expand when parsing cond :: not an app-exp")]
            )
        )
    )
)

(define (case-parse first rest)
    (console.log "In case-parse")
    (if (null? rest)
        (new app-exp (new var-exp 'void) '())
        (let ([c (car rest)])
            (if (app-exp? c)
                    (if (if (var-exp? c.rator) (equal? c.rator.id "else") #f)
                        (new app-exp (new lambda-exp '() (map syntax-expand c.rands)) '())
                        (new if-exp 
                            (rator-doer first c.rator)
                            (new app-exp (new lambda-exp '() (map syntax-expand c.rands)) '())
                            (case-parse first (cdr rest))
                        )
                    )
                (console.log "Error in syntax-expand: case can't parse non app-exp")
            )
        
        )
    )
)

(define (rator-doer first rator)
    (console.log "In Rator Doer" rator)
    (if (app-exp? rator)
        (new if-exp 
            (new app-exp (new var-exp 'eq?) (list first (var-exp->lit-exp rator.rator)))
            (new lit-exp #t)
            (syntax-expand (new app-exp (new var-exp 'or) (map (lambda (expr) (new app-exp (new var-exp 'eq?) (list first (var-exp->lit-exp expr)))) rator.rands)))
            )
        (console.log "Error in syntax-expand: Rator doer is a terrible name for a function")
    )
)

(define (var-exp->lit-exp exp)
    (cond
        [(var-exp? exp) (new lit-exp exp.id)]
        [(lit-exp? exp) exp]
        [else (console.log "Error in var-exp->lit-exp")]
    )
)

(define non-tail-funcs
    (lambda (raw-code)
        (let helper ((exp (syntax-expand (parse-exp raw-code)))
                    (in-tail-pos #t))
            (cond 
                [(app-exp? exp) 
                    (map (lambda (rand) (helper rand #f)) exp.rands)
                    (helper exp.rator #f)
                    (if (not in-tail-pos) 
                        (if (not (primProcsJS.includes exp.rator.id))
                            (nonTailCalls.push exp.rator)
                        )
                    )
                ]
                [(if-exp? exp)
                    (helper exp.test-exp #f)
                    (helper exp.then-exp in-tail-pos)
                    (helper exp.else-exp in-tail-pos)
                ]
                [(if-only-exp? exp)
                    (helper exp.test-exp #f)
                    (helper exp.then-exp in-tail-pos)
                ]
                [(lambda-exp? exp)
                    (let ((rev-bodies (reverse exp.bodies)))
                           (map (lambda (body) (helper body #f)) (cdr rev-bodies))
                           (helper (car rev-bodies) #t))
                ]
                [(let-exp? exp)
                    (map (lambda (var-ex) (helper var-ex #f)) exp.var-exps)
                    (let ((rev-bodies (reverse exp.bodies)))
                        (map (lambda (body) (helper body #f)) (cdr rev-bodies))
                        (helper (car rev-bodies) #t))
                        ]
                [(let-named-exp? exp)
                    (map (lambda (init-v) (helper init-v #f)) exp.init-vals)
                    (let ((rev-bodies (reverse exp.bodies)))
                        (map (lambda (body) (helper body #f)) (cdr rev-bodies))
                        (helper (car rev-bodies) #t))
                ]
                [(lit-exp? exp) null]
                [(var-exp? exp) null]
                [else (console.log "ERROR: Non-tail-func tail parsing error?")]
            )
        )
    
    )
)