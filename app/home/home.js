'use strict';

angular.module('myApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: 'home/home.html',
    controller: 'HomeCtrl'
  });
}])

.controller('HomeCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.graphData = {};

  function getConceptWiseData(data) {
    var cons = [];
    Object.values(data).forEach(function(arr) {
      cons = cons.concat(arr) ;
    });
    $scope.concepts = [];
    var uniqueCons = {};
    cons.filter(function(item, pos) {
      return cons.indexOf(item) == pos;
    }).forEach(function(c) {
      $scope.concepts.push(c);
      uniqueCons[c] = [];
    });
    Object.keys(data).forEach(function(entity) {
      data[entity].forEach(function(con) {
        uniqueCons[con].push(entity);
      });
    });
    return uniqueCons;
  }

  $scope.csvForm = function(arr) {
    return arr.join(', ');
  };

  $scope.parseData = function(data) {
    console.log(data);
    ApiService.getEntities(data).then(function (data) {
      var nodes = ApiService.createD3Json(data.data.result);
      $scope.graphData = { nodes: nodes, links: [] };
      console.log($scope.graphData);
      $scope.conceptData = getConceptWiseData(data.data.result);
    });
  };
}])

.factory('ApiService', ['$http', function($http) {

  function findNextId(key, nodes) {
    var j = 0;
    for(var i = 0; i < nodes.length; i++) {
      if(nodes[i].label === key) {
        j++;
      }
    }
    return j;
  }

  return {
    getEntities: function(postData) {
      return $http({
        url: 'http://213.239.219.235:9000/api/entities',
        // url: 'http://localhost:9000/api/entities',
        method: 'POST',
        data: postData,
        headers: {'Content-Type': 'text/plain'}
      });
    },
    createD3Json: function (data) {
      var nodes = [];
      Object.keys(data).forEach(function(key) {
        data[key].forEach(function(concept) {
          var obj = {
            id: findNextId(key, nodes),
            label: key,
            group: concept
          };
          nodes.push(obj);
        });
      });
      return nodes;
    }
  }
}])

.directive('graph', [function() {
  function link(scope, el) {
    var i = -1;

    scope.render = function(data) {
      if(i > 0) {
        d3.selectAll("svg > *").remove();
        var width = el[0].clientWidth;
        var height = el[0].clientHeight;
        var clicked = "";

        var color = d3.scale.category20();

        var tree = d3.layout.force();
        var drag = tree.drag()
          .origin(function(d) { return d; })
          .on("dragstart", dragstarted);          

        var graph = data;
        console.log(data);

        var svg = d3.select(el[0]).append("svg")
          .attr("width", width)
          .attr("height", height);
        
        tree.size([width, height])
          .nodes(graph.nodes)
          .links(graph.links)
          .charge(-300)
          .distance(100)
          .start();

        var schema = d3.select("svg")
          .append('g');

        var link = schema.selectAll(".link")
          .data(graph.links)
          .enter().append("line")
          .attr("class", "link")
          .style("stroke","#CCC")
          .style("stroke-width", function (d) {
            return Math.sqrt(d.value);
          });

        var gnodes = schema.selectAll('g.gnode')
          .data(graph.nodes)
          .enter()
          .append('g')
          .classed('gnode', true)
          .call(tree.drag);

        var node = gnodes.append("circle")
          .attr("class", "node")
          .attr("r", function(d) { return 30; })
          .style("fill", function(d) { return color(d.group);})
          .append("svg:title")
          .call(drag);

        gnodes.on("mouseout",function(){
          d3.select("body").select('div.tooltip').remove();
        });

        var labels = gnodes.append("text")
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .text(function(d) { return d.label; });

        tree.on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
          
          gnodes.attr("transform", function(d) {
            return 'translate(' + [d.x, d.y] + ')';
          });
        });
        
        var legend = schema.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 25 + ")"; });

        legend.append("rect")
            .attr("x", 20)
            .attr("y", 10)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color)
            .on("click", function(d) {
              console.log(d);
              d3.selectAll(".gnode").style("opacity",1);
   
              if (clicked !== d) {
                d3.selectAll(".gnode").filter(function(e) {
                  return e.group !== d;
                }).style("opacity", 0.1);
                clicked = d;
              } else {
                clicked = "";
              }
            }) ;

        legend.append("text")
            .attr("x", 40)
            .attr("y", 19)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function(d) { return d; });

        function dragstarted(d) {
          d3.event.sourceEvent.stopPropagation();
          d.fixed = true;
        }
        /*

        var nominal_base_node_size = 8;
        var nominal_text_size = 10;
        var max_text_size = 24;
        var nominal_stroke = 1.5;
        var max_stroke = 4.5;
        var max_base_node_size = 36;

        zoom.on("zoom", function () {
          var stroke = nominal_stroke;
          if (nominal_stroke * zoom.scale() > max_stroke) stroke = max_stroke / zoom.scale();
          link.style("stroke-width", stroke);
          circle.style("stroke-width", stroke);
          
          var base_radius = nominal_base_node_size;
          if (nominal_base_node_size * zoom.scale() > max_base_node_size) base_radius = max_base_node_size / zoom.scale();
          circle.attr("d", d3.svg.symbol()
          .size(function (d) {
            return Math.PI * Math.pow(size(d.size) * base_radius / nominal_base_node_size || base_radius, 2);
          })
          .type(function (d) {
            return d.type;
          }))
          
          if (!text_center) text.attr("dx", function (d) {
            return (size(d.size) * base_radius / nominal_base_node_size || base_radius);
          });
          
          var text_size = nominal_text_size;
          if (nominal_text_size * zoom.scale() > max_text_size) text_size = max_text_size / zoom.scale();
          text.style("font-size", text_size + "px");
          
          g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        });

        svg.call(zoom);
        */
      }
    };

    scope.$watch(function(scope) {
      return scope.$parent.graphData;
    } , function(newVal, oldVal) {
      i = i + 1;
      scope.render(newVal);
    }, true);
  }

  return {
    link: link,
    restrict: 'EA',
    scope: {
      data: '='
    }
  };
}]);