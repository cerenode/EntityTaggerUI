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

  $scope.parseData = function(data) {
    console.log(data);
    ApiService.getEntities(data).then(function (data) {
      var nodes = ApiService.createD3Json(data.data.result);
      $scope.graphData = { nodes: nodes, links: [] };
      console.log($scope.graphData);
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
        var width = 1380;
        var height = 800;
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
          .charge(-100)
          .gravity(0.015)
          .distance(50)
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
          .attr("r", function(d) { return d.label.length * 5; })
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
            .attr("x", width - 18)
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
            .attr("x", width - 24)
            .attr("y", 19)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });

        function dragstarted(d) {
          d3.event.sourceEvent.stopPropagation();
          d.fixed = true;
        }
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