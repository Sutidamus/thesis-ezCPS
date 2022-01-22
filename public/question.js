var questions = [
    {
        "description": "Calculate and return the factorial of n",
        "difficulty": 1,
        "extraSubstantialProcedures": [],
        "name": "Factorial-CPS",
        "testCases": [
            "(eqv? (factorial-cps 0) 1)",
            "(eqv? (factorial-cps 1) 1)",
            "(eqv? (factorial 3) 6)"
        ],
        "timeLimit": 5000
    },

    {
        "description": "Returns true if x is an element of the list, and false otherwise. ",
        "difficulty": 2,
        "extraSubstantialProcedures": [],
        "name": "Member-CPS",
        "testCases": [
            "(eq? (member-cps 'a '(b c d 1 2 3 a)) #t)"
        ],
        "timeLimit": 10000
    }
]

export default questions;