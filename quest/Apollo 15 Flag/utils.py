# -*- coding: utf-8 -*-

from __future__ import print_function
from __future__ import division

import os, sys
from os.path import join, exists, abspath, isfile, isdir, basename, abspath
import numpy as np
import re
import pandas as pd
from collections import OrderedDict
import json
from subprocess import call

from IPython.core.display import display, HTML, SVG


def parse_lables(fn_labels):
    """
    Загрузка labeling данных.

    https://github.com/cvhciKIT/sloth
    """

    with open(fn_labels) as f:
        labels = json.load(f)

    return labels

def labels2df(labels, scale):
    """
    Преобразование формат DataFrame.

    С добавлением столбцов с масштабом
    """

    points = []
    for label in labels[0]['annotations']:
        if label['class'] == 'point':
            points.append(label)
    df = pd.DataFrame(points)
    df = df.assign(xs=df.x * scale)
    df = df.assign(ys=df.y * scale)
    return df


def coords(i, df):
    """
    Координаты точки с индексем i.
    """
    row = df.loc[i]
    x = row['x']
    y = row['y']
    return np.array([x, y])

def D(i1, i2, df):
    """
    Расстояние между точками на изображении.
    """
    p1 = coords(i1, df)
    p2 = coords(i2, df)
    return np.linalg.norm(p1 - p2)


def get_labled_svg(fn, df, scale, save=False):

    points_templ = []
    for i, row in df.iterrows():
        c = coords(i, df)
        c_scaled = c * scale
        points_templ.append(point_templ.format(c_scaled[0], c_scaled[1],
                                               c_scaled[0], c_scaled[1] + 30,
                                               i
                                              ))
    svg = svg_template.format("\n".join(points_templ))

    fn_svg = fn + ".svg"
    with open(fn_svg, "w") as f:
        f.write(svg)

    fn_render = fn + ".png"

    call(["rsvg", fn_svg, fn_render])

    return svg


svg_template = """<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="576px" height="324px"
     viewBox="0 0 576 324"
     version="1.1"
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink">

  <style>
    /* <![CDATA[ */
    circle {{
      fill: none;
      stroke: red;
      stroke-width: 1px;
    }}
    /* ]]> */
  </style>

  <rect x="1" y="1" width="575" height="323" fill="none" stroke="#ff0000"/>
  <image xlink:href="a15_2.35.png" x="0" y="0" width="576px" height="324px"/>

  {}

</svg>
"""

point_templ = """
<circle cx="{}" cy="{}" r="5" />
<text x="{}" y="{}" >{}</text>
"""

