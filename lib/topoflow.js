'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _d = require('d3');

var d3 = _interopRequireWildcard(_d);

var _contextmenu = require('./lib/contextmenu');

var _contextmenu2 = _interopRequireDefault(_contextmenu);

var _math = require('./lib/math');

var _math2 = _interopRequireDefault(_math);

var _common = require('./lib/common');

var _common2 = _interopRequireDefault(_common);

require('./styles/index.css');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Flow = function () {
    // 设置默认值
    function Flow(config) {
        var _this = this;

        _classCallCheck(this, Flow);

        this.config = config; // 初始化配置参数

        this.Nodes = {}; // 当前画布中的节点信息(实时更新)
        this.Links = {}; // 当前画布的线条信息
        this.sourceNode = {}; //  源节点信息               
        this.selectedElement = null; //当前选中节点的ID
        this.optionGroup = null; // 操作按钮元素        
        this.currentMouseXY = {};
        this.isSetData = false; // 是否是回填数据模式
        this.rwaElnContainer = document.querySelector(this.config.eln);

        this.rwaElnContainer.classList.add('topoflow-container');

        if (this.config.hasOwnProperty('onNodeContextMenuRender')) {
            this.initContextMenu();
        }

        // 初始化画布
        this.svg = d3.select(config.eln).style('outline', 'none').attr('tabIndex', '0').append('svg').attr('id', 'svg_' + _common2.default.genUUID()).attr('width', this.config.width || '100%').attr('height', this.config.height);
        // 获取svg画布的宽度
        var width = Number(this.svg.attr("width").replace('px', ''));
        // 获取svg画布的高度
        var height = Number(this.svg.attr("height").replace('px', ''));
        // let height = 800;
        //初始化force
        var then = this;
        this.force = d3.forceSimulation(Object.values(this.Nodes)).alphaDecay(0.05) // 设置alpha衰减系数
        .force("link", d3.forceLink(Object.values(this.Links)).id(function (d) {
            return d.id;
        }).distance(5)) // distance为连线的距离设置
        .force('collide', d3.forceCollide().radius(function () {
            return 50;
        })) // collide 为节点指定一个radius区域来防止节点重叠。
        .force("charge", d3.forceManyBody().strength(-10)) // 节点间的作用力
        // .force("charge", d3.forceManyBody().strength(-10))  // 节点间的作用力
        .force("center", d3.forceCenter(width / 2, height / 2))
        // .alpha(1)  // 设置alpha值，让里导向图有初始动力
        .on('tick', function () {
            _this.Nodes.forEach(function (node) {
                d3.selectAll('.' + node.domId).attr('transform', function () {
                    return 'translate(' + node.x + ',' + node.y + ')';
                });
                var linksID = Object.keys(then.Links);
                linksID.map(function (linkID) {
                    var link = then.Links[linkID];
                    if (node.id === link.from || node.id === link.to) {
                        then.moveLink(link, linkID);
                    }
                });
            });
        });
        // .restart();   // 启动仿真计时器
        // 初始化路径组信息
        this.pathGroup = this.svg.append('svg:g').attr('class', 'data-flow-path-group');
        this.nodeGroup = this.svg.append('svg:g').attr('class', 'data-flow-node-group');
    }

    // 组件初始化方法调用


    _createClass(Flow, [{
        key: 'init',
        value: function init() {
            this.initDefs();
            this.initSvgEvent();
        }
    }, {
        key: 'initContextMenu',
        value: function initContextMenu() {
            var _this2 = this;

            // 初始化右键菜单
            this.contextmenu = new _contextmenu2.default({
                render: this.config.onNodeContextMenuRender.bind(this),
                container: this.rwaElnContainer,
                onClick: function onClick(nodeInfo, iteminfo) {
                    if (!!_this2.config.contextmenuClick) {
                        _this2.config.contextmenuClick.call(_this2, nodeInfo, iteminfo);
                    }
                }
            });
        }

        // 当图形发生变更的时候进行图形的变化

    }, {
        key: 'onDataChange',
        value: function onDataChange(type) {
            if (!this.isSetData && this.config.hasOwnProperty('onDataChange')) {
                this.config.onDataChange(type);
            }
        }

        // 初始化定义元素，如箭头

    }, {
        key: 'initDefs',
        value: function initDefs() {
            var defs = this.svg.append('svg:defs').attr('id', 'arrow-defs');

            // 自定义
            if (this.config.hasOwnProperty('linkTemplate') && this.config.linkTemplate.hasOwnProperty('defs')) {
                this.config.linkTemplate.defs(defs);
            } else {
                defs.append('svg:marker').attr('id', 'end-arrow').attr('viewBox', '0 -5 10 10').attr('refX', 6).attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto').append('svg:path').attr('d', 'M0,-5L10,0L0,5');
            }

            this.dragLine = this.pathGroup.append('svg:path');
            if (this.config.hasOwnProperty('linkTemplate') && this.config.linkTemplate.hasOwnProperty('dragLink')) {
                this.config.linkTemplate.dragLink(this.dragLine);
            } else {
                this.dragLine.style('fill', 'white').style('marker-end', 'url(#end-arrow)').attr('class', 'dragline hide').attr('d', 'M0,0L0,0');
            }
        }

        // 重置，将会删掉所有的线条和节点

    }, {
        key: 'reset',
        value: function reset() {
            if (this.rwaElnContainer !== null) {
                var pathGroup = this.rwaElnContainer.querySelector('.data-flow-path-group');
                if (!!pathGroup) {
                    pathGroup.innerHTML = '';
                }
                var nodeGroup = this.rwaElnContainer.querySelector('.data-flow-node-group');
                if (!!nodeGroup) {
                    nodeGroup.innerHTML = '';
                }

                var arrowDefsDom = this.rwaElnContainer.querySelector('#arrow-defs');
                if (!!arrowDefsDom) {
                    arrowDefsDom.remove();
                }
            }
            this.Nodes = [];
            this.Links = [];
            this.initDefs();
            this.onDataChange('reset');
        }

        // 清理所有选中的元素信息

    }, {
        key: 'clearAllActiveElement',
        value: function clearAllActiveElement() {
            var _this3 = this;

            this.selectedElement = null;

            d3.selectAll('.link').style('marker-end', 'url(#end-arrow)');
            d3.selectAll('.node').classed('active', false);
            d3.selectAll('.link').classed('active', false);

            if (!!this.optionGroup) {
                this.optionGroup.remove();
            }

            if (!!this.config.onClearActiveElement) {
                this.config.onClearActiveElement();
            }

            var nodes = this.Nodes;
            var nodeIDs = Object.keys(nodes);

            nodeIDs.map(function (item) {
                _this3.Nodes[item].selected = false;
            });
            this.onDataChange('clearActive');
        }
    }, {
        key: 'zoom',
        value: function zoom() {
            var then = this;

            // 画布移动缩放        
            var zoom = d3.zoom().on('zoom', function () {
                d3.selectAll(then.config.eln + ' .data-flow-path-group, ' + then.config.eln + ' .data-flow-node-group').attr('transform', d3.event.transform);
            });

            // 限制缩放的范围
            zoom.scaleExtent([0.2, 1.5]);

            // 使用移动和缩放并禁用双击
            this.svg.call(zoom).on('dblclick.zoom', null);
        }

        // svg画布的事件绑定

    }, {
        key: 'initSvgEvent',
        value: function initSvgEvent() {
            var then = this;

            this.zoom();
            this.nodaDrag();

            if (!!!this.config.readOnly) {
                this.svg.on('mousemove', function () {
                    var xy = d3.mouse(this);
                    then.currentMouseXY = {
                        x: xy[0],
                        y: xy[1]
                    };
                });

                // 鼠标线条的操作
                var linkPoint = [0, 0, 0, 0];
                this.DragLinkEvent = d3.drag().on('start', function (d) {
                    // 设置线条的起始点
                    linkPoint = [d3.event.x, d3.event.y];
                    then.sourceNode = then.Nodes[then.selectedElement.id];
                }).on('drag', function (d) {
                    // 线条跟随鼠标位置
                    linkPoint[2] = d3.event.x;
                    linkPoint[3] = d3.event.y;
                    then.dragLine.classed('hide', false).attr('d', 'M' + linkPoint[0] + ',' + linkPoint[1] + 'L' + linkPoint[2] + ',' + linkPoint[3]);
                }).on('end', function () {
                    then.dragLine.classed('hide', true);
                    var classList = d3.event.sourceEvent.target.parentNode.classList;
                    var flag = 0;
                    classList.forEach(function (v) {
                        if (v === 'data-flow-path-group') {
                            flag = 1;
                        } else if (v === 'node') {
                            flag = 2;
                        }
                    });

                    if (flag === 2) {
                        var nodeID = d3.event.sourceEvent.target.parentNode.id;
                        nodeID = nodeID.replace("node_", "");
                        var targetNode = then.Nodes[nodeID];
                        then.addLink({ from: then.sourceNode.id, to: targetNode.id });
                    }
                    if (then.config.hasOwnProperty('onDragLink')) {
                        var point = [d3.event.x, d3.event.y];
                        then.config.onDragLink(then.sourceNode, point, flag === 2);
                    }

                    then.sourceNode = {};
                    then.onDataChange('connect');
                });

                this.hotKey();
            }
        }

        // 节点拖拽事件

    }, {
        key: 'nodaDrag',
        value: function nodaDrag() {
            var nodeMouseXY = [];
            var then = this;
            this.dragEvent = function () {
                return d3.drag().on('start', function (d) {
                    // console.log('dragEvent start')

                    nodeMouseXY = d3.mouse(this);
                    then.force.alphaTarget(0.002).restart();
                    if (!!then.optionGroup) {
                        then.optionGroup.remove();
                    }
                }).on('drag', function (d) {
                    // console.log('dragEvent drag')

                    var point = {
                        x: d3.event.x - nodeMouseXY[0],
                        y: d3.event.y - nodeMouseXY[1]
                    };

                    d3.select(this).attr('transform', 'translate(' + point.x + ',' + point.y + ')');
                    // 移动节点,线条跟着变化
                    var nodeID = this.id.replace("node_", "");

                    then.Nodes[nodeID].x = point.x;
                    then.Nodes[nodeID].y = point.y;

                    var linksID = Object.keys(then.Links);
                    linksID.map(function (linkID) {
                        var link = then.Links[linkID];
                        if (nodeID === link.from || nodeID === link.to) {
                            then.moveLink(link, linkID);
                        }
                    });
                }).on('end', function () {
                    // console.log('dragEvent end')

                    then.onDataChange('moveNode');
                });
            };
        }

        // 删除节点和线条的快捷键

    }, {
        key: 'hotKey',
        value: function hotKey() {
            var then = this;
            document.querySelector(this.config.eln).addEventListener('keydown', function (e) {
                if (!!then.selectedElement && (e.keyCode === 8 || e.keyCode === 46)) {
                    if (then.selectedElement.type === 'node') {
                        then.deleteNode(then.selectedElement.id);
                    } else {
                        var link = then.Links[then.selectedElement.id];
                        then.deleteLink(link);
                    }
                }
            });
        }

        // 删除节点

    }, {
        key: 'deleteNode',
        value: function deleteNode(nodeID) {
            var _this4 = this;

            var node = this.Nodes[nodeID];
            if (!!!node) {
                return false;
            }

            if (this.config.hasOwnProperty('onDeleteNode')) {
                if (!this.config.onDeleteNode(node)) {
                    return;
                }
            }

            d3.select('#' + node.domId).remove();
            delete this.Nodes[nodeID];

            var linksID = Object.keys(this.Links);
            linksID.map(function (linkID) {
                var link = _this4.Links[linkID];
                if (link.from === nodeID || link.to === nodeID) {
                    _this4.deleteLink(link, 'force');
                }
            });

            if (!!this.optionGroup) {
                this.optionGroup.remove();
            }

            this.onDataChange('deleteNode');
        }

        // 选中节点

    }, {
        key: 'selectNode',
        value: function selectNode(nodeID) {
            this.clearAllActiveElement();
            var nodeInfo = this.Nodes[nodeID];
            nodeInfo.selected = true;

            var node = d3.select('#' + nodeInfo.domId);
            node.classed('active', true);

            this.selectedElement = {
                type: 'node',
                id: nodeID
            };
            this.onNodeClick(node, nodeInfo);
        }

        // 新增一个节点

    }, {
        key: 'addNode',
        value: function addNode(nodeInfo) {
            var then = this;

            if (!!!nodeInfo.id) {
                nodeInfo.id = _common2.default.genUUID();
            }
            nodeInfo.domId = 'node_' + nodeInfo.id;
            if (!this.config.nodeTemplate.hasOwnProperty(nodeInfo.type)) {
                return;
            }
            nodeInfo.index = this.Nodes.length;
            // nodeInfo.fx = null;   // 当节点的fx、fy都为null时，节点处于活动状态
            // nodeInfo.fy = null;  
            var template = this.config.nodeTemplate[nodeInfo.type];

            nodeInfo.width = template.width;
            nodeInfo.height = template.height;

            var node = this.nodeGroup.append('g').attr('class', 'node').attr('class', nodeInfo.domId).on('contextmenu', function () {
                d3.event.preventDefault();
                if (then.config.hasOwnProperty('onNodeContextMenuRender')) {
                    then.contextmenu.show(_extends({ contextType: 'node' }, nodeInfo), then.currentMouseXY);
                }
            }).on('click', function () {
                then.config.onSelectNode(this, nodeInfo);
                then.selectNode(nodeInfo.id);
                then.onNodeClick(node, nodeInfo);
            }).attr('transform', 'translate(' + nodeInfo.x + ', ' + nodeInfo.y + ')');

            if (!!this.dragEvent) {
                node.call(this.dragEvent());
            }

            // 调用参数定义的        
            this.config.nodeTemplate[nodeInfo.type].renderNode(node, nodeInfo);

            // 保存节点信息        
            this.Nodes[nodeInfo.id] = nodeInfo;
            this.onDataChange('addNode');
            then.force.nodes(Object.values(this.Nodes)).force("link", d3.forceLink(Object.values(then.Links)).id(function (d) {
                return d.id;
            }).distance(40)); // distance为连线的距离设置
            then.force.alpha(1).restart();

            return nodeInfo;
        }
    }, {
        key: 'onNodeClick',
        value: function onNodeClick(node, nodeInfo) {
            var then = this;
            this.sourceNode = nodeInfo;
            var template = this.config.nodeTemplate[nodeInfo.type];
            if (!template) {
                console.warn(nodeInfo.type + ' template not found ');
                return;
            }

            if (!!this.optionGroup) {
                this.optionGroup.remove();
            }

            this.optionGroup = this.nodeGroup.append('g').attr('class', nodeInfo.id);
            if (!!!this.config.readOnly) {
                this.optionGroup.append('rect').style('fill', 'none').style('stroke', '#68a987').style('stroke-width', '1px').attr('width', nodeInfo.width).attr('height', nodeInfo.height).attr('transform', 'translate(' + nodeInfo.x + ', ' + nodeInfo.y + ') ');

                template.operatingPoint.forEach(function (item) {
                    then.optionGroup.append('svg:circle').attr('class', 'operating-point').attr('r', 5).attr('fill', 'white').attr('stroke', '#06a0e9').attr('transform', function () {
                        if (item === 'right') {
                            return 'translate(' + (nodeInfo.x + nodeInfo.width) + ', ' + (nodeInfo.y + nodeInfo.height / 2) + ')';
                        } else if (item === 'left') {
                            return 'translate(' + nodeInfo.x + ', ' + (nodeInfo.y + nodeInfo.height / 2) + ')';
                        }
                    }).call(then.DragLinkEvent);
                });

                if (template.deleteAble) {
                    // 删除按钮
                    var del_btn = this.optionGroup.append('g').attr('class', 'delete-not-btn').attr('transform', 'translate(' + (nodeInfo.width + nodeInfo.x) + ', ' + nodeInfo.y + ') ');

                    del_btn.append('svg:circle').attr('stroke', 'red').attr('fill', 'red').attr('r', 6);

                    del_btn.append('svg:path').attr('stroke', 'white').attr('stroke-width', 2).attr('d', 'M-3,-3L3,3');

                    del_btn.append('svg:path').attr('stroke', 'white').attr('stroke-width', 2).attr('d', 'M3,-3L-3,3');

                    del_btn.on('click', function () {
                        then.deleteNode(nodeInfo.id);
                    });
                }
            }
        }

        // 移动节点的时候节点相关的线条跟着移动

    }, {
        key: 'moveLink',
        value: function moveLink(link, linkID) {
            var sourceNode = this.Nodes[link.from];
            var targetNode = this.Nodes[link.to];

            var points = _math2.default.calculateLinkPoint(sourceNode, targetNode, this.config);
            if (points.length === 4) {
                d3.select('#' + link.domId).attr('d', 'M' + points[0] + ',' + points[1] + 'L' + points[2] + ', ' + points[3]);
            }
        }

        // 增加线条

    }, {
        key: 'addLink',
        value: function addLink(link, node2) {
            if (node2) {
                link = { from: link.id, to: node2.id };
            }
            var _link = link,
                to = _link.to,
                from = _link.from,
                id = _link.id;

            var sourceNode = this.Nodes[from];
            var targetNode = this.Nodes[to];
            var then = this;
            var gid = id || _common2.default.genUUID();
            var domId = 'link_' + (id || _common2.default.genUUID());
            var points = _math2.default.calculateLinkPoint(sourceNode, targetNode, this.config);

            if (points.length !== 4) {
                return;
            }

            var path = this.pathGroup.append('svg:path').attr('id', domId).attr('class', 'link');

            if (this.config.hasOwnProperty('linkTemplate') && this.config.linkTemplate.hasOwnProperty('path')) {
                this.config.linkTemplate.path(path);
            } else {
                path.style('marker-end', 'url(#end-arrow)');
            }

            this.Links[gid] = {
                domId: domId,
                id: gid,
                from: sourceNode.id,
                to: targetNode.id,
                source: sourceNode.id,
                target: targetNode.id
            };

            path.attr('d', 'M' + points[0] + ', ' + points[1] + 'L' + points[2] + ', ' + points[3]).on('contextmenu', function () {
                d3.event.preventDefault();
                if (then.config.hasOwnProperty('onNodeContextMenuRender')) {
                    then.contextmenu.show(_extends({ contextType: 'link' }, then.Links[gid]), then.currentMouseXY);
                }
            }).on('click', function () {
                then.clearAllActiveElement();
                path.classed('active', true);
                then.config.onSelectLink(this, _extends({}, link, { domId: domId }));

                then.selectedElement = {
                    type: 'link',
                    id: gid
                };
            });

            if (!this.isSetData && this.config.hasOwnProperty('onConnect')) {
                this.config.onConnect(this.Links[gid], sourceNode, targetNode);
            }

            then.force.nodes(Object.values(this.Nodes)).force("link", d3.forceLink(Object.values(then.Links)).id(function (d) {
                return d.id;
            }).distance(40)); // distance为连线的距离设置
            then.force.alpha(1).restart();

            this.onDataChange('addLink');
        }
    }, {
        key: 'deleteLink',
        value: function deleteLink(link, type) {
            var _this5 = this;

            if (type !== 'force' && !this.isSetData && this.config.hasOwnProperty('onDeleteLink')) {
                var promise = this.config.onDeleteLink(link);
                if (promise instanceof Promise) {
                    promise.then(function (r) {
                        delete _this5.Links[link.id];
                        d3.select('#' + link.domId).remove();
                        _this5.onDataChange('deleteLink');
                    });
                }
            } else {
                delete this.Links[link.id];
                d3.select('#' + link.domId).remove();
                this.onDataChange('deleteLink');
            }
        }
    }]);

    return Flow;
}();

exports.default = Flow;
//# sourceMappingURL=topoflow.js.map