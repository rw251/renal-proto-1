/*jslint browser: true*/
/*jshint -W055 */
/*global $, c3, Mustache, pb*/

(function () {
   'use strict';
	var pb = {};

	var destroyCharts = function(charts){
		for(var i = 0 ; i<charts.length; i++){
			if(pb[charts[i]]) {
				pb[charts[i]].destroy();
				delete pb[charts[i]];
			}
		}
	};

	var addChart = function(item){
		destroyCharts([item+'-chart']);

		var chartOptions = {
			bindto: '#chart',
			data: {
				x: 'x',
				columns: pb.data[item].trend
			},
			padding: {
				right: 30
			},
      zoom:{
        enabled: true
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
						format: function (x) {
							if (x === parseInt(x, 10)) return x;
							else return x.toFixed(2);
						}
					},
					min : pb.data[item].axis.min,
					max : pb.data[item].axis.max
				}
			}/*,
			regions: [
				{axis: 'y', start: pb.data[item].normal.min, end: pb.data[item].normal.max, class: 'regionX'}
			]*/
		};

		pb[item+'-chart'] = c3.generate(chartOptions);
	};

  var showPage = function(id){
    var template = $('#value-item').html();
    Mustache.parse(template);

    $(".item-slot").each(function(index, value){
      if(index >= 10 || id*10 + index >= pb.all.length) {
        $(value).html("");
      } else {
        $(value).html(Mustache.render(template, pb.all[id*10 + index]));
      }
    });
  };

  var page = function(id) {
    $(".page").hide();

    $('#' + id).show();
  };

	pb.wireUpPages = function () {
    page("overviewPage");

    //disable pagination
    $("ul.pagination li").each(function(index, value) {
      if(index > pb.all.length/10) $(this).addClass("disabled");
    });


    showPage(0);

    //pagination
    $("ul.pagination li a").on('click', function(){
      if($(this).parent().hasClass("disabled")) return;

      $("ul.pagination li").removeClass("active");
      $(this).parent().addClass("active");

      showPage(parseInt($(this).text())-1);
    });

    $('#overviewPage').on('click', '.value-item', function(){
      var item = $(this).data('mx');

      page('detailPage');

      var template = $('#value-item-wide').html();
      Mustache.parse(template);

      $('#detail').html(Mustache.render(template, pb.data[item]));

      addChart(item);
    });

    $('#back-button').on('click', function(){
      page("overviewPage");
    });
	};

	pb.loadData = function(callback) {
		$.getJSON("data.json", function(file) {
			pb.data = file;
      pb.all = [];
			pb.normal = [];
			pb.abnormal = [];
			for(var o in file){
				if(file[o].value>=file[o].normal.min && file[o].value <= file[o].normal.max) {
					pb.normal.push({name:o,value:file[o].value,units:file[o].units});
				} else {
					pb.abnormal.push({name:o,value:file[o].value,units:file[o].units});
				}
        file[o].name = o;
        file[o].date = file[o].trend[0][file[o].trend[0].length-1];
        if(file[o].trend[1].length>1){
          file[o].change = Math.round((file[o].trend[1][file[o].trend[1].length-1] - file[o].trend[1][file[o].trend[1].length-2]) * 100) / 100;
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
$(document).on('ready', function () {
	//Load the data then wire up the events on the page
	pb.loadData(pb.wireUpPages);

	$('#chart-panels .panel-body').niceScroll();
});
