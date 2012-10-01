
// Generated by CoffeeScript 1.3.3

/*
container: DOM element or its ID for canvas
weights: area weights, {cards: [100, 200], overlap: 50, labels: ['X', 'Y']}
baseRadius: largest circle radius
opts: drawing options

NOTE: the bigger circle is always drawn on the left
*/


(function() {
  var calcAngles, calcRadiuses, calcRadiuses3, draw2, draw3, findAngle, findDistance, findDistance3, g_fontFamily, g_fontSize, g_margin, g_threshold, intersectionArea, normalizeWeights, normalizeWeights3, root, scaleIntersection, scaleIntersection3, venn2, venn3;

  g_margin = 2;

  g_threshold = 0.1;

  g_fontFamily = "Corbel, 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', 'DejaVu Sans', 'Bitstream Vera Sans', 'Liberation Sans', Verdana, 'Verdana Ref', sans-serif";

  g_fontSize = 11;

  venn2 = function(container, weights, baseRadius, opts) {
    var distance, height, interArea, labels, paper, radiuses, 
        width, _ref, overlapLabel;
    if (baseRadius == null) {
      baseRadius = 100;
    }
    opts = opts || {
      fill: ["red", "blue"],
      "fill-opacity": [0.7, 0.7]
    };    
    height = (baseRadius + g_margin) * 2;
    width = height * 2;
    paper = Raphael(container, width, height);
    normalizeWeights(weights);
    radiuses = calcRadiuses(height, weights.cards);
    interArea = scaleIntersection(weights, Math.max.apply(Math, radiuses));
    distance = findDistance(radiuses, interArea);
    labels = (_ref = weights.labels) != null ? _ref.slice(0) : void 0;
    overlapLabel = weights.overlapLabel
    if (weights.cards[0] < weights.cards[1]) {
      if (labels != null) {
        labels.reverse();
      }
      opts.fill.reverse();
      opts["fill-opacity"].reverse();
    }
    return draw2(paper, height, radiuses, distance, opts, labels, overlapLabel);
  };

  /*
  container: DOM element or its ID for canvas
  weights: area weights, {cards: [A, B, C], overlap: [AB, AC, BC], labels:["A", "B", "C"]}
  baseRadius: largest circle radius
  opts: drawing options
  
  NOTE: the bigger circle is always drawn on the left
  */


  venn3 = function(container, weights, baseRadius, opts) {
    var diameter, distances, height, interAreas, paper, radiuses, width;
    if (baseRadius == null) {
      baseRadius = 100;
    }
    opts = opts || {
      fill: ["#FF6633", "#7FC633", "#22C6DE"],
      "fill-opacity": [0.8, 0.8, 0.8]
    };
    height = 4 * baseRadius + 2 * g_margin;
    width = 6 * baseRadius + 2 * g_margin;
    paper = Raphael(container, width, height);
    diameter = baseRadius * 2;
    normalizeWeights3(weights);
    radiuses = calcRadiuses3(diameter, weights.cards);
    interAreas = scaleIntersection3(weights.overlap, baseRadius, Math.max.apply(Math, weights.cards));
    distances = findDistance3(radiuses, interAreas);
    return draw3(paper, radiuses, distances, interAreas, opts, weights.labels);
  };

  /*
  helpers for venn2
  */


  calcRadiuses = function(maxDiameter, cards) {
    var big, r, small, _ref;
    _ref = cards[0] > cards[1] ? cards : cards.slice(0).reverse(), big = _ref[0], small = _ref[1];
    r = maxDiameter / 2.0 - g_margin;
    return [r, r * Math.sqrt(small / big)];
  };

  normalizeWeights = function(weights) {
    var maxOverlap;
    maxOverlap = Math.min.apply(Math, weights.cards);
    if (maxOverlap < weights.overlap) {
      weights.overlap = maxOverlap;
    }
    if (weights.overlap < 0) {
      return weights.overlap = 0;
    }
  };

  intersectionArea = function(radiuses, angles) {
    var alpha, area, beta, r1, r2;
    r1 = radiuses[0], r2 = radiuses[1];
    alpha = angles[0], beta = angles[1];
    area = function(r, angle) {
      return 0.5 * Math.pow(r, 2) * (angle - Math.sin(angle));
    };
    return area(r1, alpha) + area(r2, beta);
  };

  calcAngles = function(radiuses, distance) {
    var angle, r1, r2;
    angle = function(r1, r2, d) {
      return 2 * Math.acos((Math.pow(d, 2) + Math.pow(r1, 2) - Math.pow(r2, 2)) / (2 * r1 * d));
    };
    r1 = radiuses[0], r2 = radiuses[1];
    return [angle(r1, r2, distance), angle(r2, r1, distance)];
  };

  scaleIntersection = function(weights, radius) {
    var big;
    big = Math.max.apply(Math, weights.cards);
    return Math.PI * Math.pow(radius, 2) * weights.overlap / big;
  };

  findDistance = function(radiuses, interArea) {
    var angles, area, d, delta, lower, rleft, rright, upper, _ref;
    rleft = radiuses[0], rright = radiuses[1];
    _ref = [rleft - rright, rleft + rright], lower = _ref[0], upper = _ref[1];
    d = (upper + lower) / 2.0;
    while (true) {
      angles = calcAngles(radiuses, d);
      area = intersectionArea(radiuses, angles);
      delta = area - interArea;
      if (Math.abs(delta) < g_threshold) {
        break;
      }
      if (delta < 0) {
        upper = d;
      } else {
        lower = d;
      }
      d = (upper + lower) / 2.0;
    }
    return d;
  };

  draw2 = function(paper, height, radiuses, distance, opts, labels, overlapLabel) {
    var bb, bbs, cxleft, cxright, cyleft, cyright, left, r1, r2, rbb, right, rightEdges, t, t1, t2, texts, tx, ty1, ty2, w, _i, _len, _ref, _ref1;
    _ref = [radiuses[0] + g_margin, radiuses[0] + g_margin], cxleft = _ref[0], cyleft = _ref[1];
    _ref1 = [cxleft + distance, cyleft], cxright = _ref1[0], cyright = _ref1[1];
    left = paper.circle(cxleft, cyleft, radiuses[0]);
    left.attr({
      "stroke-width": 0,
      fill: opts.fill[0],
      "fill-opacity": opts["fill-opacity"][0]
    });
    right = paper.circle(cxright, cyright, radiuses[1]);
    right.attr({
      "stroke-width": 0,
      fill: opts.fill[1],
      "fill-opacity": opts["fill-opacity"][1]
    });    
    rbb = right.getBBox();
    w = rbb.x2;
    if (labels != null) {
      if (height < 30) {
        height = 30;
      }
      tx = w + 10;
      ty1 = (height - 23) / 2.0;
      ty2 = (height + 3) / 2.0;
      ty3 = (height + 29) / 2.0;
      r1 = paper.rect(tx, ty1, 10, 10);
      r2 = paper.rect(tx, ty2, 10, 10);
      r3 = paper.rect(tx, ty3, 10, 10);
      r3_1 = paper.rect(tx, ty3, 10, 10);
      r1.attr({
        "stroke-width": 0,
        fill: opts.fill[0],
        "fill-opacity": opts["fill-opacity"][0]
      });
      r2.attr({
        "stroke-width": 0,
        fill: opts.fill[1],
        "fill-opacity": opts["fill-opacity"][1]
      });
      r3.attr({
        "stroke-width": 0,
        fill: opts.fill[0],
        "fill-opacity": opts["fill-opacity"][0]
      });
      r3_1.attr({
        "stroke-width": 0,
        fill: opts.fill[1],
        "fill-opacity": opts["fill-opacity"][1]
      });
      t1 = paper.text(tx + 13, ty1 + 5, labels[0]);
      t2 = paper.text(tx + 13, ty2 + 5, labels[1]);
      t3 = paper.text(tx + 13, ty3 + 5, overlapLabel);
      texts = [t1, t2, t3];
      for (_i = 0, _len = texts.length; _i < _len; _i++) {
        t = texts[_i];
        t.attr({
          "text-anchor": "start",
          "font-family": g_fontFamily,
          "font-size": g_fontSize
        });
      }
      bbs = (function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = texts.length; _j < _len1; _j++) {
          t = texts[_j];
          _results.push(t.getBBox());
        }
        return _results;
      })();
      rightEdges = (function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = bbs.length; _j < _len1; _j++) {
          bb = bbs[_j];
          _results.push(bb.x2);
        }
        return _results;
      })();
      w = Math.max.apply(Math, rightEdges);
    }
    return paper.setSize(w + g_margin, height);
  };

  /*
  Helpers for venn3
  */


  normalizeWeights3 = function(weights) {
    var a, ab, abMin, ac, acMin, b, bc, bcMin, c, _ref, _ref1;
    _ref = weights.overlap, ab = _ref[0], ac = _ref[1], bc = _ref[2];
    _ref1 = weights.cards, a = _ref1[0], b = _ref1[1], c = _ref1[2];
    abMin = Math.min(a, b);
    acMin = Math.min(a, c);
    bcMin = Math.min(b, c);
    ab = ab < abMin ? ab : abMin;
    ac = ac < acMin ? ac : acMin;
    bc = bc < bcMin ? bc : bcMin;
    ab = ab < 0 ? 0 : ab;
    ac = ac < 0 ? 0 : ac;
    bc = bc < 0 ? 0 : bc;
    return weights.overlap = [ab, ac, bc];
  };

  calcRadiuses3 = function(maxDiameter, cards) {
    var maxWeight, r, weight, _i, _len, _results;
    maxWeight = Math.max.apply(Math, cards);
    r = maxDiameter / 2.0;
    _results = [];
    for (_i = 0, _len = cards.length; _i < _len; _i++) {
      weight = cards[_i];
      _results.push(r * Math.sqrt(weight / maxWeight));
    }
    return _results;
  };

  scaleIntersection3 = function(overlap, maxRadius, maxWeight) {
    var weight, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = overlap.length; _i < _len; _i++) {
      weight = overlap[_i];
      _results.push(Math.PI * Math.pow(maxRadius, 2) * weight / maxWeight);
    }
    return _results;
  };

  findDistance3 = function(radiuses, interAreas) {
    var area, d1, d2, maxRadius, radiuses2;
    maxRadius = Math.max.apply(Math, radiuses);
    if (radiuses[0] === maxRadius) {
      radiuses2 = [radiuses[0], radiuses[1]];
      area = interAreas[0];
      d1 = findDistance(radiuses2, area);
      radiuses2 = [radiuses[0], radiuses[2]];
      area = interAreas[1];
      d2 = findDistance(radiuses2, area);
      return {
        maxIndex: 0,
        AB: d1,
        AC: d2
      };
    } else if (radiuses[1] === maxRadius) {
      radiuses2 = [radiuses[1], radiuses[0]];
      area = interAreas[0];
      d1 = findDistance(radiuses2, area);
      radiuses2 = [radiuses[1], radiuses[2]];
      area = interAreas[2];
      d2 = findDistance(radiuses2, area);
      return {
        maxIndex: 1,
        BA: d1,
        BC: d2
      };
    } else {
      radiuses2 = [radiuses[2], radiuses[0]];
      area = interAreas[1];
      d1 = findDistance(radiuses2, area);
      radiuses2 = [radiuses[2], radiuses[1]];
      area = interAreas[2];
      d2 = findDistance(radiuses2, area);
      return {
        maxIndex: 2,
        CA: d1,
        CB: d2
      };
    }
  };

  findAngle = function(r1, r2, d1, d2, area) {
    var angles, d, delta, inter, lower, maxArea, radiuses, upper, _ref;
    if (Math.abs(d1 - d2) >= r1 + r2) {
      return Math.PI;
    }
    radiuses = r1 > r2 ? [r1, r2] : [r2, r1];
    angles = calcAngles(radiuses, Math.abs(d1 - d2));
    maxArea = intersectionArea(radiuses, angles);
    if (maxArea <= area) {
      return 0;
    }
    _ref = [Math.abs(d1 - d2), r1 + r2], lower = _ref[0], upper = _ref[1];
    d = (upper + lower) / 2.0;
    while (true) {
      angles = calcAngles(radiuses, d);
      inter = intersectionArea(radiuses, angles);
      delta = inter - area;
      if (Math.abs(delta) < g_threshold) {
        break;
      }
      if (delta < 0) {
        upper = d;
      } else {
        lower = d;
      }
      d = (upper + lower) / 2.0;
    }
    return Math.acos((Math.pow(d1, 2) + Math.pow(d2, 2) - Math.pow(d, 2)) / (2 * d1 * d2));
  };

  draw3 = function(paper, radiuses, distances, areas, opts, labels) {
    var angle, b, bb, bbs, bottomEdges, c, c1, c2, c3, cx, cx2, cx3, cy, cy2, cy3, h, i, index, leftEdges, r, r1, r2, r3, rects, rightEdges, rx, ry1, ry2, ry3, second, secondDistance, secondIndex, t, t1, t2, t3, texts, thirdArea, thirdDistance, thirdIndex, topEdges, topx, topy, w, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2;
    console.log(labels);
    index = distances.maxIndex;
    r = radiuses[index];
    cx = cy = 3 * r + g_margin;
    c1 = paper.circle(cx, cy, r);
    c1.attr({
      "stroke-width": 0,
      fill: opts.fill[index],
      "fill-opacity": opts["fill-opacity"][index]
    });
    second = radiuses.slice(0).sort(function(a, b) {
      if (a === b) {
        return 0;
      } else if (a < b) {
        return -1;
      } else {
        return 1;
      }
    })[1];
    secondIndex = -1;
    for (i = _i = 0; _i < 3; i = ++_i) {
      if (radiuses[i] === second && i !== index) {
        secondIndex = i;
      }
    }
    thirdIndex = 3 - index - secondIndex;
    secondDistance = thirdDistance = thirdArea = null;
    switch (index) {
      case 0:
        thirdArea = areas[2];
        if (secondIndex === 1) {
          secondDistance = distances.AB;
          thirdDistance = distances.AC;
        } else {
          secondDistance = distances.AC;
          thirdDistance = distances.AB;
        }
        break;
      case 1:
        thirdArea = areas[1];
        if (secondIndex === 0) {
          secondDistance = distances.BA;
          thirdDistance = distances.BC;
        } else {
          secondDistance = distances.BC;
          thirdDistance = distances.BA;
        }
        break;
      case 2:
        thirdArea = areas[0];
        if (secondIndex === 0) {
          secondDistance = distances.CA;
          thirdDistance = distances.CB;
        } else {
          secondDistance = distances.CB;
          thirdDistance = distances.CA;
        }
    }
    cx2 = cx + secondDistance;
    cy2 = cy;
    c2 = paper.circle(cx2, cy2, second);
    c2.attr({
      "stroke-width": 0,
      fill: opts.fill[secondIndex],
      "fill-opacity": opts["fill-opacity"][secondIndex]
    });
    angle = findAngle(radiuses[secondIndex], radiuses[thirdIndex], secondDistance, thirdDistance, thirdArea);
    cx3 = cx + thirdDistance * Math.cos(angle);
    cy3 = cy - thirdDistance * Math.sin(angle);
    c3 = paper.circle(cx3, cy3, radiuses[thirdIndex]);
    c3.attr({
      "stroke-width": 0,
      fill: opts.fill[thirdIndex],
      "fill-opacity": opts["fill-opacity"][thirdIndex]
    });
    bbs = [c1.getBBox(), c2.getBBox(), c3.getBBox()];
    _ref = [
      (function() {
        var _j, _len, _results;
        _results = [];
        for (_j = 0, _len = bbs.length; _j < _len; _j++) {
          b = bbs[_j];
          _results.push(b.x);
        }
        return _results;
      })(), (function() {
        var _j, _len, _results;
        _results = [];
        for (_j = 0, _len = bbs.length; _j < _len; _j++) {
          b = bbs[_j];
          _results.push(b.x2);
        }
        return _results;
      })()
    ], leftEdges = _ref[0], rightEdges = _ref[1];
    _ref1 = [
      (function() {
        var _j, _len, _results;
        _results = [];
        for (_j = 0, _len = bbs.length; _j < _len; _j++) {
          b = bbs[_j];
          _results.push(b.y);
        }
        return _results;
      })(), (function() {
        var _j, _len, _results;
        _results = [];
        for (_j = 0, _len = bbs.length; _j < _len; _j++) {
          b = bbs[_j];
          _results.push(b.y2);
        }
        return _results;
      })()
    ], topEdges = _ref1[0], bottomEdges = _ref1[1];
    w = Math.max.apply(Math, rightEdges) - Math.min.apply(Math, leftEdges) + 2 * g_margin;
    h = Math.max.apply(Math, bottomEdges) - Math.min.apply(Math, topEdges) + 2 * g_margin;
    topy = Math.min.apply(Math, topEdges);
    topx = Math.min.apply(Math, leftEdges);
    _ref2 = [c1, c2, c3];
    for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
      c = _ref2[_j];
      c.attr({
        cx: c.attr("cx") - topx + g_margin,
        cy: c.attr("cy") - topy + g_margin
      });
    }
    if (labels != null) {
      if (h < 40) {
        h = 40;
      }
      rx = w + 10;
      ry1 = (h - 36) / 2.0;
      ry2 = (h - 10) / 2.0;
      ry3 = (h + 16) / 2.0;
      r1 = paper.rect(rx, ry1, 10, 10);
      r2 = paper.rect(rx, ry2, 10, 10);
      r3 = paper.rect(rx, ry3, 10, 10);
      rects = [r1, r2, r3];
      for (i = _k = 0; _k < 3; i = ++_k) {
        rects[i].attr({
          "stroke-width": 0,
          fill: opts.fill[i],
          "fill-opacity": opts["fill-opacity"][i]
        });
      }
      t1 = paper.text(rx + 13, ry1 + 5, labels[0]);
      t2 = paper.text(rx + 13, ry2 + 5, labels[1]);
      t3 = paper.text(rx + 13, ry3 + 5, labels[2]);
      texts = [t1, t2, t3];
      for (_l = 0, _len1 = texts.length; _l < _len1; _l++) {
        t = texts[_l];
        t.attr({
          "text-anchor": "start",
          "font-family": g_fontFamily,
          "font-size": g_fontSize
        });
      }
      bbs = (function() {
        var _len2, _m, _results;
        _results = [];
        for (_m = 0, _len2 = texts.length; _m < _len2; _m++) {
          t = texts[_m];
          _results.push(t.getBBox());
        }
        return _results;
      })();
      rightEdges = (function() {
        var _len2, _m, _results;
        _results = [];
        for (_m = 0, _len2 = bbs.length; _m < _len2; _m++) {
          bb = bbs[_m];
          _results.push(bb.x2);
        }
        return _results;
      })();
      w = Math.max.apply(Math, rightEdges) + g_margin;
    }
    return paper.setSize(w, h);
  };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.venn2 = venn2;

  root.venn3 = venn3;

}).call(this);