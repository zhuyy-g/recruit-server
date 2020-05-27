var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5')
const {UserModel, ChatModel} = require('../db/models')
// 指定过滤的属性
const filter = {password: 0, _v: 0}

/* GET home page. */
// 注册的路由
router.post('/register', (req, res) => {
  const {username, password, type} = req.body
  UserModel.findOne({username}, (err, user) => {
    if(user) {
      res.send({code: 1, msg: '此用户已存在'})
    }else {
      new UserModel({username, type, password: md5(password)}).save((err, user) => {
        // 生成cookie('userid': user._id)
        res.cookie('userid', user._id, {maxAge: 1000*69*60*24})
        // 响应数据中不要携带password
        const data = {username, type, _id: user._id}
        res.send({code: 0, data})
      })
    }
  })
})

router.post('/login', (req, res) => {
  const {username, password} = req.body
  UserModel.findOne({username, password: md5(password)}, filter,  (err, user) => {
    if(user) {
      // 生成cookie('userid': user._id)
      res.cookie('userid', user._id, {maxAge: 1000*69*60*24})
      res.send({code: 0, data: user})
    }else {
      res.send({code: 1, msg: '用户名或密码不正确'})
    }
  })
})

// 更新用户信息的路由
router.post('/update', (req, res) => {
  // 从请求的cookie得到userid
  const userid = req.cookies.userid
  // 如果不存在 直接返回一个提示信息
  if(!userid) {
    return res.send({code: 1, msg: '请先登录'})
  }
  // 得到提交的用户数据
  const user = req.body
  UserModel.findByIdAndUpdate({_id: userid}, user, (err, oldUser) => {
    if(!oldUser) {
      // 通知浏览器删除 userid cookie
      res.clearCookie('userid')
      res.send({code: 1, msg: '请先登录'})
    }else {
      // 准备返回一个user对象
      const {_id, username, type} = oldUser
      const data = Object.assign({_id, username, type}, user)
      res.send({code: 0, data})
    }
  })
})

// 获取用户信息的路由（根据cookie中的userid）
router.get('/user', (req, res) => {
  // 从请求的cookie中得到userid
  const userid = req.cookies.userid
  // 如果不存在 直接返回一个提示信息
  if(!userid) {
    return res.send({code: 1, msg: '请先登录'})
  }
  // 根据userid查询对应的user
  UserModel.findOne({_id: userid}, filter, (err, user) => {
    res.send({code: 0, data: user})
  })
})

// 根据类型获取用户列表
router.get('/userlist', (req, res) => {
  const {type} = req.query
  console.log(req.query)
  UserModel.find({type}, filter, (error, users) => {
    res.send({code: 0, data: users})
  })
})

// 获取当前拥护所有相关聊天信息列表
router.get('/msgList', (req, res) => {
  const userid = req.cookies.userid
  UserModel.find((err, userDocs) => {
    // 用对象存储所有的user信息 key为user_id val为name和header组成的user对象
    const users = {}
    userDocs.forEach(doc => {
      users[doc._id] = {username: doc.username, header: doc.header}
    })
    // 查询userid相关的所有聊天信息
    ChatModel.find({'$or': [{from: userid}, {to: userid}]}, filter, (err, chatMsgs) => {
      // 返回所有用户以及和当前用户相关的聊天记录
      res.send({code: 0, data: {users, chatMsgs}})
    })
  })
})

// 修改指定消息为已读
router.post('/readmsg', (req, res) => {
  // 得到请求的from和to
  const from = req.body.from
  const to = req.cookies.userid
  // 更新数据中的chat数据
  // 参数1: 查询条件
  // 参数2：更新为指定的数据对象
  // 参数3：是否一次更新多条 默认只更新一条
  // 参数4：更新完成的回调函数
  ChatModel.update({from, to,  read: false}, {read: true}, {multi: true}, (err, doc) => {
    res.send({code: 0, data: doc.nModified}) // 更新的数量
  })
})

module.exports = router;
