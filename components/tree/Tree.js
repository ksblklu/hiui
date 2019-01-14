import React, { Component } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
// import Checkbox from '../checkbox/index'
import TreeNode from './TreeNode'
import isEqual from 'lodash/isEqual'
import { calcDropPosition, deepClone } from './util'
import './style/index'
const dealData = (data, tempData = {}, parent) => {
  data.map((item) => {
    tempData[item.id] = {...item}
    if (parent) {
      tempData[item.id].parent = parent
    }
    if (item.children && item.children.length > 0) {
      const tempArr = []
      item.children.map((i) => {
        tempArr.push(i.id)
      })
      tempData[item.id].children = tempArr
      dealData(item.children, tempData, item.id)
    }
  })
}
const deepMap = (data, parent) => {
  let arr = []
  for (let key in data) {
    let item = {...data[key]}
    if (item.children && item.children.length > 0) {
      arr = arr.concat(deepMap(item.children, item.id))
      delete item.children
      arr.push(item)
    } else {
      item.parent = parent
      arr.push(item)
    }
  }
  return arr
}

export default class Tree extends Component {
  constructor (props) {
    super(props)

    this.state = {
      hasChecked: [],
      hasExpanded: [],
      dataMap: {},
      data: {},
      dragNode: '',
      dragNodePosition: null
    }
  }

  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    defaultCheckedKeys: PropTypes.arrayOf(PropTypes.any),
    onDragStart: PropTypes.func,
    // render: PropTypes.func,
    defaultExpandAll: PropTypes.bool,
    checkable: PropTypes.bool,
    draggable: PropTypes.bool,
    withLine: PropTypes.bool
  }

  static defaultProps = {
    prefixCls: 'hi-tree'
  }

  static getDerivedStateFromProps (props, prevState) {
    let data = null

    if (!isEqual(props.data, prevState.data)) {
      const dataMap = {}
      dealData(deepClone(props.data), dataMap)
      data = {}
      data.dataMap = dataMap
      data.data = props.data

      if (Object.keys(prevState.data).length === 0) {
        if (props.defaultExpandAll) {
          let tempExpandedArr = []
          for (let key in dataMap) {
            if (dataMap[key].children && dataMap[key].children.length > 0) {
              tempExpandedArr.push(dataMap[key].id)
            }
          }
          data.hasExpanded = tempExpandedArr
        }
      }
    }
    return data
  }

  onCheckChange (checked, item) {
    const {
      onCheckChange
    } = this.props
    let checkedArr = this.state.hasChecked

    if (checked) {
      checkedArr.splice(checkedArr.indexOf(item.id), 1)
    } else {
      checkedArr.push(item.id)
    }
    this.setCheckTreeCheckedParent(item.id, checked, checkedArr)
    this.setCheckTreeCheckedChild(item.id, checked, checkedArr)

    this.setState({
      hasChecked: checkedArr
    })

    // let data = deepMap(this.props.data).filter(item => checkedArr.includes(item.id)).map(item => item.id)
    onCheckChange && onCheckChange(checkedArr, item.title, !checked)
  }

  setCheckTreeCheckedChild (id, checked, tempCheckedArr) {
    const {dataMap} = this.state
    if (dataMap[id].children && dataMap[id].children.length > 0) {
      dataMap[id].children.map((i) => {
        if (checked) {
          if (tempCheckedArr.indexOf(i) >= 0) {
            tempCheckedArr.splice(tempCheckedArr.indexOf(i), 1)
          }
        } else {
          if (tempCheckedArr.indexOf(i) < 0) {
            tempCheckedArr.push(i)
          }
        }
      })
    }
    if (dataMap[id].children) {
      dataMap[id].children.map((i) => {
        this.setCheckTreeCheckedChild(i, checked, tempCheckedArr)
      })
    }
  }

  setCheckTreeCheckedParent (id, checked, tempCheckedArr) {
    const {dataMap} = this.state
    if (checked) {
      if (tempCheckedArr.indexOf(id) >= 0) {
        tempCheckedArr.splice(tempCheckedArr.indexOf(id), 1)
      }
    } else {
      let allChecked = true

      dataMap[id].children && dataMap[id].children.map((i) => {
        if (tempCheckedArr.indexOf(i) < 0) {
          allChecked = false
        }
      })
      if (allChecked && tempCheckedArr.indexOf(id) < 0) { tempCheckedArr.push(id) }
    }
    if (dataMap[id].parent) {
      this.setCheckTreeCheckedParent(dataMap[id].parent, checked, tempCheckedArr)
    }
  }

  onExpanded (expanded, item) {
    let expandedArr = this.state.hasExpanded

    if (expandedArr.indexOf(item.id) >= 0) {
      expandedArr.splice(expandedArr.indexOf(item.id), 1)
    } else {
      expandedArr.push(item.id)
    }
    this.setState({
      hasExpanded: expandedArr
    })
  }

   // 当拖拽元素开始被拖拽的时候触发的事件
   onDragStart = (e, data) => {
     const { onDragStart } = this.props
     e.stopPropagation()

     let expandedArr = this.state.hasExpanded

     if (expandedArr.indexOf(data.id) >= 0) {
       expandedArr.splice(expandedArr.indexOf(data.id), 1)
     }

     this.dargNode = e.target
     this.curData = data
     this.setState({
       expandedKeys: expandedArr
     })
     if (onDragStart) {
       onDragStart(e)
     }

     try {
       e.dataTransfer.setData('text/plain', '')
     } catch (error) {
     }
   }
  // 当拖拽完成后触发的事件
  onDragEnd = (e) => {
    const { onDragEnd } = this.props
    e.stopPropagation()

    if (onDragEnd) {
      onDragEnd(e)
    }
  }

  // 当拖曳元素进入目标元素的时候触发的事件
  onDragEnter = (e, data) => {
    const { onDragEnter } = this.props
    let dropPosition = calcDropPosition(e, e.currentTarget)

    e.preventDefault()
    e.stopPropagation()

    if (data.id === this.curData.id && dropPosition === 0) {
      this.setState({
        dragNode: '',
        dragNodePosition: null
      })
      return
    }

    setTimeout(() => {
      this.setState({
        dragNode: data.id,
        dragNodePosition: dropPosition
      })
    }, 0)

    if (onDragEnter) {
      onDragEnter({ event: e, dropPosition })
    }
  }
  // 拖拽元素在目标元素上移动的时候触发的事件
  onDragOver = (e) => {
    const { onDragOver } = this.props
    e.preventDefault()
    e.stopPropagation()

    if (onDragOver) {
      onDragOver(e)
    }
  }
  // 当拖拽元素离开目标元素时触发
  onDragLeave = (e) => {
    const { onDragLeave } = this.props
    e.stopPropagation()

    this.setState({
      dragNode: '',
      dragNodePosition: null
    })

    if (onDragLeave) {
      onDragLeave(e)
    }
  }
  // 被拖拽的元素在目标元素上同时鼠标放开触发的事件
  onDrop = (e, data, parentData) => {
    const { onDrop } = this.props
    console.log(e, data, parentData)
    e.preventDefault()
    e.stopPropagation()
    this.setState({
      dragNode: '',
      dragNodePosition: null
    })
    this.props.dragEnd(this.curData, data, parentData)
    if (onDrop) {
      onDrop(e)
    }
  }

  renderTreeNodes (data) {
    const { prefixCls, draggable, checkable, closeIcon, openIcon, withLine } = this.props
    const { dragNode, dragNodePosition } = this.state

    return (
      <TreeNode
        draggable={draggable || undefined}
        onDragStart={this.onDragStart}
        onDragEnter={this.onDragEnter}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}
        checked={this.state.hasChecked}
        expanded={this.state.hasExpanded}
        onCheckChange={this.onCheckChange.bind(this)}
        onExpanded={this.onExpanded.bind(this)}
        data={data}
        dragNodePosition={dragNodePosition}
        dragNode={dragNode}
        prefixCls={prefixCls}
        checkable={checkable}
        openIcon={openIcon}
        closeIcon={closeIcon}
        withLine={withLine}
      />
    )
  }

  render () {
    const { prefixCls, draggable, style } = this.props
    const classes = classNames(`${prefixCls}`, {
      'draggable-tree': draggable
    })

    return (
      <div className={classes}
        style={style}
      >
        {this.renderTreeNodes(this.state.data)}
      </div>
    )
  }
}
