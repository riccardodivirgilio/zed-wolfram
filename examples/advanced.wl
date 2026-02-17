(* Advanced Wolfram Language Examples *)

(* --- Packages and contexts --- *)
BeginPackage["MyPackage`"]

MyFunction::usage = "MyFunction[x] computes something useful."
MyConstant::usage = "MyConstant is a useful constant."

Begin["`Private`"]

MyConstant = N[GoldenRatio, 20]

MyFunction[x_?NumericQ] := Module[{result},
  result = x^2 + MyConstant * x;
  If[result > 0, Sqrt[result], 0]
]

MyFunction[x_List] := Map[MyFunction, x]

End[]
EndPackage[]

(* --- Module, Block, and With scoping --- *)
Module[{x = 10, y},
  y = x + 5;
  x * y
]

Block[{$RecursionLimit = 100},
  Fibonacci[50]
]

With[{n = 10},
  Table[Prime[i], {i, n}]
]

(* --- Associations and datasets --- *)
data = Dataset[{
  <|"name" -> "Alice", "age" -> 30, "score" -> 95|>,
  <|"name" -> "Bob", "age" -> 25, "score" -> 87|>,
  <|"name" -> "Carol", "age" -> 35, "score" -> 92|>
}]

data[Select[#age > 28 &], "name"]
data[GroupBy["age"], Mean, "score"]

(* --- Image processing --- *)
img = ExampleData[{"TestImage", "Lena"}]
EdgeDetect[img]
ImageAdjust[img, {0.2, 0.5}]
Binarize[img, 0.5]
ColorNegate[img]

(* --- Machine learning --- *)
classifier = Classify[
  {"spam" -> "buy now free offer",
   "spam" -> "click here to win",
   "ham" -> "meeting at 3pm",
   "ham" -> "project update attached"}
]

classifier["free money click now"]
ClassifierMeasurements[classifier, testData, "Accuracy"]

(* --- Graph theory --- *)
g = Graph[{1 -> 2, 2 -> 3, 3 -> 1, 1 -> 4, 4 -> 5},
  VertexLabels -> "Name",
  EdgeStyle -> Directive[Thick, Gray]
]

FindShortestPath[g, 1, 5]
GraphDiameter[g]
ConnectedGraphQ[g]
BetweennessCentrality[g]

(* --- Parallel computation --- *)
LaunchKernels[4]
ParallelTable[PrimeQ[2^Prime[n] - 1], {n, 1, 20}]
ParallelMap[FactorInteger, Range[1000, 1010]]

(* --- Nested comments work correctly --- *)
(* This is a comment
   (* This is a nested comment *)
   Back to the outer comment *)

(* --- Error handling --- *)
Catch[
  Do[
    If[i > 5, Throw["too large"]];
    Print[i],
    {i, 10}
  ]
]

Check[1/0, "division by zero"]
Quiet[Message[Sin::argx, 1, 2]]

(* --- File I/O --- *)
Export["data.csv", {{1, 2, 3}, {4, 5, 6}}, "CSV"]
Import["data.csv", "Data"]
ReadList["file.txt", String]

(* --- Deployment --- *)
CloudDeploy[
  APIFunction[{"x" -> "Number"},
    #x^2 &
  ]
]
