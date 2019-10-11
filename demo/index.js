import TopoFlow from '../lib';
// import TopoFlow from '../src';
import './index.scss'

// import testSvg from './test.svg'
import testSvg from './test.png'
const json = `    
{    "jumpCoreInfo": {
        "links": [
            {
                "from": "235834",
                "id": null,
                "to": "235371"
            },
            {
                "from": "235371",
                "id": "13054",
                "to": "235390"
            },
            {
                "from": "235390",
                "id": "13055",
                "to": "235379"
            },
            {
                "from": "235379",
                "id": "13056",
                "to": "235378"
            },
            {
                "from": "235378",
                "id": null,
                "to": "235835"
            },
            {
                "from": "235839",
                "id": null,
                "to": "235378"
            },
            {
                "from": "235378",
                "id": "13056",
                "to": "235379"
            },
            {
                "from": "235379",
                "id": "13057",
                "to": "235382"
            },
            {
                "from": "235382",
                "id": null,
                "to": "235840"
            },
            {
                "from": "235382",
                "id": "13058",
                "to": "235386"
            },
            {
                "from": "235386",
                "id": "13059",
                "to": "235389"
            },
            {
                "from": "235389",
                "id": null,
                "to": "235841"
            }
        ],
        "nodes": [
            {
                "name": "阜新市阜新银行总行资源点机房ODF",
                "id": "235834",
                "type": "10"
            },
            {
                "name": "阜新市阜新银行总行ODF1",
                "id": "235371",
                "type": "2"
            },
            {
                "name": "阜新市解放大街与街心路2号光交箱",
                "id": "235390",
                "type": "1"
            },
            {
                "name": "阜新经济开发区5号光交箱",
                "id": "235379",
                "type": "1"
            },
            {
                "name": "阜新市阜新银行液压支行资源ODF1",
                "id": "235378",
                "type": "2"
            },
            {
                "name": "阜新市阜新银行液压支行资源点机房ODF",
                "id": "235835",
                "type": "10"
            },
            {
                "name": "910F-阜新液压支行",
                "id": "235839",
                "type": "10"
            },
            {
                "name": "阜新市中天机房ODF1",
                "id": "235382",
                "type": "2"
            },
            {
                "name": "960-阜新中天公司无线机房",
                "id": "235840",
                "type": "10"
            },
            {
                "name": "阜新市开发区无线机房ODF2",
                "id": "235386",
                "type": "2"
            },
            {
                "name": "阜新喀斯汀无线机房ODF1",
                "id": "235389",
                "type": "2"
            },
            {
                "name": "960-阜新喀斯汀无线机房",
                "id": "235841",
                "type": "10"
            }
        ]
    }}`
class Index {
    constructor() {
        this.data = JSON.parse(json).jumpCoreInfo
    }

    initTopoFlow() {

        this.data.nodes.forEach(element => {
                element['x'] =0;
                element['y'] =0;
        });
        let config = {
            eln: '#topoflow1',
            data: this.data,
            // https://bl.ocks.org/steveharoz/8c3e2524079a8c440df60c1ab72b5d03
            alphaDecay:0.1,
            alpha:1,
            distance:40,
            radius:70,
            strength:-10,
            height: `600px`,
            width: `1200px`,
            // readOnly:true,
            // 模板
            linkTemplate:{
                defs:(defs)=>{
                    defs.append('svg:path')
                    .attr('d', 'M0,-5L10,0L0,5')
                }
            },
            nodeTemplate: {
                "1": {
                    width: 50,
                    height: 50,
                    deleteAble: true,
                    operatingPoint: ['left', 'right'],
                    renderNode: (node, nodeInfo) => {
                        node.append('image')
                            .attr('xlink:href',testSvg)
                            .attr('height', nodeInfo.height)
                            .attr('width', nodeInfo.width)
                        node.append('text')
                            .attr('x', -30)
                            .attr('y', 70)
                            .html(nodeInfo.name);
                    }
                },
                "10": {
                    width: 50,
                    height: 50,
                    deleteAble: true,
                    operatingPoint: [
                        'left', 'right'
                    ],
                    renderNode: (node, nodeInfo) => {
                        node.append('image')
                        .attr('xlink:href',testSvg)
                        .attr('height', nodeInfo.height)
                        .attr('width', nodeInfo.width)

                        node.append('text')
                        .attr('x', -30)
                        .attr('y', 70)
                            .html(nodeInfo.name);
                    }
                },
                "2": {
                    width: 50,
                    height: 50,
                    deleteAble: true,
                    operatingPoint: [
                        'left', 'right'
                    ],
                    renderNode: (node, nodeInfo) => {
                        node.append('image')
                        .attr('xlink:href',testSvg)
                        .attr('height', nodeInfo.height)
                        .attr('width', nodeInfo.width)

                        node.append('text')
                        .attr('x', -30)
                        .attr('y', 70)
                            .html(nodeInfo.name);
                    }
                }
            },
            onSelectNode: (eln, node) => {
                console.log('onSelectNode', eln, node);
            },
            onSelectLink: (eln, node) => {
                console.log('onSelectLink', eln, node);
            },
            onClearActiveElement: () => {
                console.log('清空所有选中状态');
            },            
            onNodeContextMenuRender: (nodeInfo) => {
                if (nodeInfo.contextType === 'node') {
                    return [
                        { label: '删除节点', action: 'deleteNode' },
                        { label: '详情', action: 'h_detail' }
                    ];
                } else if (nodeInfo.contextType === 'link') {
                    return [
                        { label: '删除线', action: 'deleteLink' },
                    ]
                }
            },
            contextmenuClick: (node, action) => {
                switch (action.action) {
                    case 'deleteNode':
                        this.topoFlow.deleteNode(node.id);
                    case 'deleteLink':                        
                        this.topoFlow.deleteLink(node);
                }
                console.log('menu click', node, action);
            },
            onChange: data => {
                console.log('data change', data);
            },
            onConnect: (source, target) => {
                console.log('on connect', source, target);
            },
            onDeleteLink: link => {
                return new Promise((resolve, reject) => {
                    resolve(link);
                });
            }
        };
        this.topoFlow = new TopoFlow(config);

    }
    initDemoEvent() {
        // 创建节点
        document.querySelector('#addNode').addEventListener('click', () => {
            let nodeType = document.querySelector('#node-type').value;
            let name = document.querySelector('#node-name').value || `${nodeType}_${Math.floor(Math.random() * 1000)}`;
            this.topoFlow.addNode({
                type: '1',
                x: 100,
                y: 100,
                name 
            });
        });
        document.querySelector('#getNodes').addEventListener('click', () => {
            console.log("getNodes",this.topoFlow.getNodes())
        });
        // 创建节点
        document.querySelector('#btn2').addEventListener('click', () => {

            let node1 = this.topoFlow.addNode({
                type: '1',
                x: 100,
                y: 100,
                name 
            });

            let node2 = this.topoFlow.addNode({
                type: '1',
                x: 400,
                y: 100,
                name 
            });
            this.topoFlow.addLink(node1, node2)
        });
    }
};

let index = new Index();
index.initTopoFlow();
index.initDemoEvent();