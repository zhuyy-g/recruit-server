// 测试使用mongoose操作mongodb数据库
const md5 = require('blueimp-md5')
// 1.引入mongoose
const mongoose = require('mongoose')
// 2.连接指定数据库
mongoose.connect('mongodb://localhost:27017/recruit-database')
// 3.获取连接对象
const conn = mongoose.connection
// 4.绑定连接完成的监听
conn.on('connected', function() {
    console.log('数据库连接成功！！')
})

// 得到对应特定集合的Model
// 1.定义Schema(描述文档结构)
const userSchema = mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    type: {type: String, required: true},
    header: {type: String}
})
// 2.定义Model(与集合对应, 可以操作集合)
const UserModel = mongoose.model('user', userSchema)

// 3.1 通过Model实例的save()添加数据
function testSave() {
    const userModel = new UserModel({username: 'Jack', password: md5('123'), type: 'laoban'})
    userModel.save(function(error, user) {
        console.log('save()', error, user)
    })
}
testSave()

// 3.2 通过Model的find()/findOne()查询多个或者一个数据
function testFind() {
    // 查询多个 得到是包含所有匹配文档对象的数组 如果没有匹配就是[]
    UserModel.find((error, users) => {
        console.log('find()', error, users)
    })
    // 查询一个 得到的是匹配的文档对象 如果没有匹配就是null
    UserModel.findOne({_id: '5ebf83acab49592cd4012ce4'}, (error, user) => {
        console.log('findOne()', error, user)
    })
}
testFind()

// 通过Model的findByIdAndUpdate()更新某个数据
function testUpdate() {
    UserModel.findByIdAndUpdate({_id: '5ebf83acab49592cd4012ce4'}, (error, oldUser) => {
        console.log('findByIdAndUpdate()', error, oldUser)
    })
}
testUpdate()

// 通过Model的remove()删除匹配的数据    
function testDelete() {
    UserModel.remove({_id: '5ebf83acab49592cd4012ce4'}, (error, doc) => {
        console.log('remove()', error, doc)
    })
}
testDelete()