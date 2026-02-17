(* Graphics and Visualization Examples *)

(* --- 2D Plots --- *)
Plot[Sin[x], {x, 0, 2 Pi}]

Plot[{Sin[x], Cos[x], Tan[x]}, {x, -Pi, Pi},
  PlotRange -> {-2, 2},
  PlotStyle -> {Red, Blue, Green},
  PlotLegends -> {"Sin", "Cos", "Tan"},
  AxesLabel -> {"x", "y"},
  PlotLabel -> "Trigonometric Functions"
]

(* --- 3D Plots --- *)
Plot3D[Sin[x] * Cos[y], {x, -Pi, Pi}, {y, -Pi, Pi},
  ColorFunction -> "Rainbow",
  Mesh -> None,
  PlotPoints -> 50
]

ContourPlot[x^2 + y^2, {x, -2, 2}, {y, -2, 2},
  Contours -> 10,
  ColorFunction -> "TemperatureMap"
]

(* --- Graphics primitives --- *)
Graphics[{
  {Red, Disk[{0, 0}, 1]},
  {Blue, Opacity[0.5], Rectangle[{-0.5, -0.5}, {0.5, 0.5}]},
  {Thick, Green, Line[{{-1, -1}, {1, 1}}]},
  {Orange, PointSize[Large], Point[{0, 0}]},
  Text["Hello", {0, 1.2}]
}]

Graphics3D[{
  {Red, Sphere[{0, 0, 0}, 1]},
  {Blue, Opacity[0.3], Cuboid[{-1, -1, -1}, {1, 1, 1}]},
  {Green, Cylinder[{{0, 0, -2}, {0, 0, 2}}, 0.5]}
}]

(* --- Data visualization --- *)
BarChart[{1, 3, 2, 5, 4},
  ChartLabels -> {"A", "B", "C", "D", "E"},
  ChartStyle -> "Pastel"
]

PieChart[{30, 20, 50},
  ChartLabels -> Placed[{"Alpha", "Beta", "Gamma"}, "RadialCallout"],
  ChartStyle -> {Red, Green, Blue}
]

ListPlot[Table[{x, Sin[x] + RandomReal[{-0.1, 0.1}]}, {x, 0, 2 Pi, 0.1}],
  PlotStyle -> PointSize[Medium]
]

(* --- Interactive --- *)
Manipulate[
  Plot[Sin[n x], {x, 0, 2 Pi}, PlotRange -> {-1, 1}],
  {n, 1, 10, 1}
]
