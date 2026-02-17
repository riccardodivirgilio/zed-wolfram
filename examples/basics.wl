(* Basic Wolfram Language Examples *)

(* --- Arithmetic and built-in functions --- *)
Sin[Pi/4]
Sqrt[2] + Exp[1]
Log[10, 1000]
N[Pi, 50]

(* --- Variables and assignments --- *)
x = 42
y := x^2 + 1
z ^= Sqrt[x]

(* --- Lists and associations --- *)
list = {1, 2, 3, 4, 5}
nested = {{a, b}, {c, d}}
assoc = <|"name" -> "Wolfram", "version" -> 14|>

(* --- Function definitions --- *)
square[x_] := x^2
factorial[0] = 1
factorial[n_Integer] := n * factorial[n - 1]

(* Pure functions *)
Map[# + 1 &, {1, 2, 3}]
Select[Range[20], PrimeQ]
SortBy[{"hello", "hi", "hey"}, StringLength]

(* --- Pattern matching --- *)
Cases[{1, "a", 2, "b", 3}, _Integer]
Replace[{1, 2, 3}, {x_, y_, z_} :> x + y + z]
MatchQ[{1, 2, 3}, {__Integer}]

(* --- Rule-based programming --- *)
expr /. x_Integer :> x^2
expr //. {a___, x_, y_, b___} /; x > y :> {a, y, x, b}

(* --- String operations --- *)
StringJoin["Hello", " ", "World"]
StringReplace["the cat sat", "cat" -> "dog"]
StringCases["abc123def456", DigitCharacter ..]

(* --- Functional programming --- *)
Fold[Plus, 0, Range[10]]
FoldList[Times, 1, Range[5]]
NestList[Cos, 1.0, 10]
FixedPoint[Cos, 1.0]
Through[{Min, Max, Mean}[{3, 1, 4, 1, 5}]]

(* --- Control flow --- *)
If[x > 0, "positive", "non-positive"]
Which[x < 0, "negative", x == 0, "zero", True, "positive"]
Do[Print[i], {i, 5}]
Table[i^2, {i, 10}]

(* --- Numerical computation --- *)
NSolve[x^3 - 2 x + 1 == 0, x]
NIntegrate[Sin[x]^2, {x, 0, Pi}]
FindRoot[Cos[x] == x, {x, 0.5}]
LinearSolve[{{1, 2}, {3, 4}}, {5, 6}]

(* --- Symbolic computation --- *)
Integrate[x^2 * Exp[-x], {x, 0, Infinity}]
D[Sin[x] * Cos[x], x]
Series[Exp[x], {x, 0, 5}]
DSolve[y'[x] + y[x] == x, y[x], x]
Simplify[Sin[x]^2 + Cos[x]^2]

(* --- System variables --- *)
$Version
$MachineName
$ProcessorCount

(* --- Prefix and postfix notation --- *)
Print @ "hello world"
Print @ Sqrt[2]
Length @ {1, 2, 3}
Head @ 42

"hello world" // Print
Sqrt[2] // N
{3, 1, 4, 1, 5} // Sort // Reverse
Range[10] // Select[PrimeQ] // Total

(* Chaining styles *)
Print @ StringJoin["a", "b", "c"]
{"x", "y", "z"} // StringJoin // Print
Map[ToUpperCase, {"hello", "world"}] // StringRiffle // Print

(* Operator forms / currying *)
Map[StringLength] @ {"ciao", "hello", "hi"}
Select[EvenQ] @ {1, 2, 3, 4, 5}
SortBy[StringLength] @ {"alpha", "be", "gamma"}
GroupBy[EvenQ] @ Range[10]

(* --- Operators --- *)
f @@ {1, 2, 3}
f @@@ {{1, 2}, {3, 4}}
g /@ {1, 2, 3}
h // InputForm
a && b || !c
x === y
x =!= y
1 ;; 5
