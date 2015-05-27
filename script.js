/*jslint browser: true*/
/*jshint -W055 */
/*global $, c3, Mustache, pb*/

(function() {
  'use strict';
  var pb = {};

  var destroyCharts = function(charts) {
    for (var i = 0; i < charts.length; i++) {
      if (pb[charts[i]]) {
        pb[charts[i]].destroy();
        delete pb[charts[i]];
      }
    }
  };

  var getDateString = function(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return date.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  };

  var addChart = function(item) {
    destroyCharts([item + '-chart']);

    var chartOptions = {
      bindto: '#chart',
      data: {
        x: 'x',
        columns: pb.data[item].trend
      },
      padding: {
        right: 30
      },
      zoom: {
        enabled: true
      },
      tooltip: {
        format: {
          title: function(x) {
            return getDateString(x) + " - Source: " + pb.data[item].sources[getDateString(x)];
          }
        }
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: '%Y-%m-%d',
            count: 9,
            culling: {
              max: 6
            }
          }
        },
        y: {
          tick: {
            format: function(x) {
              if (x === parseInt(x, 10)) return x;
              else return x.toFixed(2);
            }
          },
          min: pb.data[item].axis.min,
          max: pb.data[item].axis.max
        }
      }
    };

    pb[item + '-chart'] = c3.generate(chartOptions);
  };

  var showPage = function(id) {
    var template = $('#value-item').html();
    Mustache.parse(template);

    $(".item-slot").each(function(index, value) {
      if (index >= 10 || id * 10 + index >= pb.all.length) {
        $(value).html("");
      } else {
        $(value).html(Mustache.render(template, pb.all[id * 10 + index]));
      }
    });
  };

  var page = function(id) {
    $(".page").hide();

    $('#' + id).show();
  };

  pb.wireUpPages = function() {
    page("overviewPage");

    //disable pagination
    $("ul.pagination li").each(function(index) {
      if (index > pb.all.length / 10) $(this).addClass("disabled");
    });


    showPage(0);

    //pagination
    $("ul.pagination li a").on('click', function() {
      if ($(this).parent().hasClass("disabled")) return;

      $("ul.pagination li").removeClass("active");
      $(this).parent().addClass("active");

      showPage(parseInt($(this).text()) - 1);
    });

    $('#overviewPage').on('click', '.value-item', function() {
      var item = $(this).data('mx');

      page('detailPage');

      var template = $('#value-item-wide').html();
      Mustache.parse(template);

      $('#detail').html(Mustache.render(template, pb.data[item]));

      addChart(item);
    });

    $('#back-button').on('click', function() {
      page("overviewPage");
    });
  };

  var getTrend = function(values, name) {
    var x = ["x"];
    var vals = [name];

    for (var i = 0; i < values.length; i++) {
      x.push(values[i].date);
      vals.push(values[i].value);
    }

    return [x, vals];
  };

  var getSources = function(values) {
    var x = {};

    for (var i = 0; i < values.length; i++) {
      x[values[i].date] = values[i].source;
    }

    return x;
  };

  var getProps = function(values) {
    var min = values[0].value;
    var max = values[0].value;
    var tot = 0;

    for (var i = 1; i < values.length; i++) {
      tot += values[i].value;
      if (values[i].value < min) min = values[i].value;
      if (values[i].value > max) max = values[i].value;
    }
    var mean = Math.round(100 * tot / values.length) / 100;

    return {
      "mean": mean,
      "max": max,
      "min": min
    };
  };

  pb.loadData = function(callback) {
    $.getJSON("data.json", function(file) {
      pb.data = file;
      pb.all = [];
      for (var o in file) {
        file[o].name = o;
        file[o].trend = getTrend(file[o].values, o);
        file[o].date = file[o].trend[0][file[o].trend[0].length - 1];
        file[o].value = file[o].trend[1][file[o].trend[1].length - 1];
        file[o].source = file[o].values[file[o].values.length - 1].source;
        file[o].sources = getSources(file[o].values);
        file[o].props = getProps(file[o].values);
        if (file[o].trend[1].length > 1) {
          file[o].change = Math.round((file[o].trend[1][file[o].trend[1].length - 1] - file[o].trend[1][file[o].trend[1].length - 2]) * 100) / 100;
        } else {
          file[o].change = 0;
        }

        file[o].direction = file[o].change > 0 ? "-up" : (file[o].change < 0 ? "-down" : "s-h");

        pb.all.push(file[o]);
      }

      callback();
    });
  };

  window.pb = pb;
})();

/******************************************
 *** This happens when the page is ready ***
 ******************************************/
$(document).on('ready', function() {
  //Load the data then wire up the events on the page
  pb.loadData(pb.wireUpPages);

  $('#chart-panels .panel-body').niceScroll();
});
