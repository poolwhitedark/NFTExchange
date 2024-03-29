<template>
  <div class="app-container">

    <!-- 查询和其他操作 -->
    <div class="filter-container">
      <el-input v-model="listQuery.username" clearable class="filter-item width-200px" :placeholder="$t('systemManagement.placeholder1')" />
      <el-button v-permission="['GET /admin/admin/list']" class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">{{$t('systemManagement.select')}}</el-button>
      <el-button v-permission="['POST /admin/admin/create']" class="filter-item" type="primary" icon="el-icon-edit" @click="handleCreate">{{$t('systemManagement.add')}}</el-button>
      <el-button :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">{{$t('systemManagement.export')}}</el-button>
    </div>

    <!-- 查询结果 -->
    <el-table v-loading="listLoading" :data="list" :element-loading-text="$t('util.loadingText')" border fit highlight-current-row>
      <el-table-column align="center" :label="$t('systemManagement.administratorID')" prop="id" sortable />

      <el-table-column align="center" :label="$t('systemManagement.administratorName')" prop="username" />

      <el-table-column align="center" :label="$t('systemManagement.administratorAvatar')" prop="avatar">
        <template slot-scope="scope" v-if="scope.row.avatar">
          <media :url="scope.row.avatar" type="image" :isPreview="true"></media>
        </template>
      </el-table-column>

      <el-table-column align="center" :label="$t('systemManagement.administratorRoles')" prop="roleIds">
        <template slot-scope="scope">
          <el-tag v-for="roleId in scope.row.roleIds" :key="roleId" type="primary" class="mr-20px"> {{ formatRole(roleId,scope) }} </el-tag>
        </template>
      </el-table-column>

      <el-table-column align="center" :label="$t('systemManagement.operation')" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button v-permission="['POST /admin/admin/update']" type="primary" size="mini" @click="handleUpdate(scope.row)">{{$t('systemManagement.edit')}}</el-button>
          <el-button v-permission="['POST /admin/admin/delete']" type="danger" size="mini" @click="handleDelete(scope.row)">{{$t('systemManagement.delete')}}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <!-- 添加或修改对话框 -->
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="dataForm" status-icon label-position="left" label-width="100px" class="dataFormClass">
        <el-form-item :label="$t('systemManagement.administratorName')" prop="username">
          <el-input v-model="dataForm.username" />
        </el-form-item>
        <el-form-item :label="$t('systemManagement.administratorPassword')" prop="password">
          <el-input v-model="dataForm.password" type="password" auto-complete="off" />
        </el-form-item>
        <el-form-item :label="$t('systemManagement.administratorAvatar')" prop="avatar">
          <el-upload
              ref="upload"
              action=""
              :auto-upload="false"
              :show-file-list="false"
              :file-list="filelist"
              :limit="1"
              class="avatar-uploader"
              accept="image/jpg, image/jpeg, image/png, image/gif"
              :on-change="
                (file) => {
                  uploadChange(file, 'uploadImage');
                }
              "
            >
              <template v-if="dataForm.avatar">
                <media :url="dataForm.avatar" type="image"></media>
              </template>
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
            </el-upload>
        </el-form-item>
        <el-form-item :label="$t('systemManagement.administratorRoles')" prop="roleIds">
          <el-select v-model="dataForm.roleIds" multiple :placeholder="$t('systemManagement.pleaseSelect')">
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{$t('util.cancel')}}</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">{{$t('util.confirm')}}</el-button>
        <el-button v-else type="primary" @click="updateData">{{$t('util.confirm')}}</el-button>
      </div>
    </el-dialog>

  </div>
</template>
<script>
import { uploadPath } from '@/api/index'
import { getToken } from '@/utils/auth'
import Pagination from '@/components/Pagination' // Secondary package 
import Media from "@/components/Media";
export default {
  name: 'Admin',
  components: { Pagination, Media },
  data() {
    return {
      uploadPath,
      list: null,
      total: 0,
      roleOptions: null,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        username: undefined,
        sort: 'create_time',
        order: 'desc'
      },
      dataForm: {
        id: undefined,
        username: undefined,
        password: undefined,
        avatar: undefined,
        roleIds: []
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: this.$t('systemManagement.edit'),
        create: this.$t('systemManagement.create')
      },
      rules: {
        username: [
          { required: true, message: this.$t('systemManagement.rule1'), trigger: 'blur' }
        ],
        password: [{ required: true, message: this.$t('systemManagement.rule2'), trigger: 'blur' }]
      },
      downloadLoading: false,
      filelist: [],
      fileImage: ""
    }
  },
  created() {
   this.init();
  },
  methods: {
    init(){
    this.getList()
    this.$api('role.roleOptions')
      .then(response => {
        this.roleOptions = response.data.list
      })
    },
    formatRole(roleId,scope) {
      if(this.roleOptions <=0 ) return;
      for (let i = 0; i < this.roleOptions.length; i++) {
        if (roleId === this.roleOptions[i].value) {
          return this.roleOptions[i].label
        }
      }
      return ''
    },
    getList() {
      this.listLoading = true
      this.$api('admin.listAdmin',this.listQuery)
        .then(response => {
          this.list = response.data.list
          this.total = response.data.total
          this.listLoading = false
        })
        .catch(() => {
          this.list = []
          this.total = 0
          this.listLoading = false
        })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    resetForm() {
      this.dataForm = {
        id: undefined,
        username: undefined,
        password: undefined,
        avatar: undefined,
        roleIds: []
      }
      this.fileImage = "";
    },
    uploadChange(file) {
      this.filelist = [];
      this.fileImage = file.raw;
      var event = event || window.event;
      var file = event.target.files[0];
      var reader = new FileReader();
      var _this = this;
      reader.onload = function (e) {
        _this.dataForm.avatar = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    handleCreate() {
      this.resetForm()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          if (this.fileImage) {
            Promise.all([this.handlerUpload()])
              .then((res) => {
                this.createApi(res)
              })
              .catch((err) => {
                this.failCallback();
              });
          } else {
            this.createApi()
          }
        }
      })
    },
    createApi(file) {
      let {avatar} = this.dataForm;
      avatar = file ? file[0].url : "";
      this.dataForm.avatar = avatar;
this.$api('admin.createAdmin',this.dataForm)
            .then(response => {
              this.list.unshift(response.data)
              this.dialogFormVisible = false
              if(!response.errno){
              this.$notify.success({
                title: this.$t('util.success'),
                message:this.$t('systemManagement.addingAdministratorSucceeded')
              })
              }
              else{
                this.$notify.error({
                title: this.$t('util.fail'),
                message: this.$t('response.'+response.data.errno)
              })
              }
              this.init();
            })
            .catch(response => {
              this.$notify.error({
                title: this.$t('util.fail'),
                message: this.$t('response.'+response.data.errno)
              })
            })
    },
    handlerUpload() {
      return new Promise((resolve, reject) => {
        let formData = new FormData();
        formData.append("file", this.fileImage);
        this.$api("storage.create", formData)
          .then((res) => {
            if (this.$tool.checkResponse(res)) {
              resolve(res.data);
            } else {
              reject(res);
            }
          })
          .catch((err) => {
            reject(err);
          });
      });
    },
    uploadChange(file) {
      this.filelist = [];
      this.fileImage = file.raw;
      var event = event || window.event;
      var file = event.target.files[0];
      var reader = new FileReader();
      var _this = this;
      reader.onload = function (e) {
        _this.dataForm.avatar = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    handleUpdate(row) {
      this.fileImage = "";
      this.dataForm = Object.assign({}, row);
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    failCallback(err) {
      this.apiLoading = false;
      this.$notify.error({
        title: this.$t("blind.fail"),
        message: err
          ? this.$t("response." + err.data ? err.data.errno: "")
          : this.$t("blind.messageFail"),
      });
      if (this.dialogStatus == "del" || this.dialogStatus == "sync") {
        this.handlerCancel();
      }
    },
    updateData() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          if (this.fileImage) {
            Promise.all([this.handlerUpload()])
              .then((res) => {
                console.log('update')
                this.editApi(res)
              })
              .catch((err) => {
                this.failCallback();
              });
          } else {
            this.editApi()
          }
          
        }
      })
    },
    editApi(file) {
      console.log(file)
      let { avatar } = this.dataForm;
      avatar = file ? file[0].url : avatar;
      this.dataForm.avatar = avatar;
      this.$api('admin.updateAdmin',this.dataForm)
            .then((response) => {
              // for (const v of this.list) {
              //   if (v.id === this.dataForm.id) {
              //     const index = this.list.indexOf(v)
              //     this.list.splice(index, 1, this.dataForm)
              //     break
              //   }
              // }
              console.log(response)
              if(!response.errno){
                this.getList()
                this.$notify.success({
                  title: this.$t('util.success'),
                  message: this.$t('systemManagement.updateAdministratorSucceeded')
                })
                this.dialogFormVisible = false
              }
              else{
                this.$notify.error({
                title: this.$t('util.fail'),
                message: this.$t('response.'+response.data.errno)
              })
              }
            })
            .catch(response => {
              this.$notify.error({
                title: this.$t('util.fail'),
                message: this.$t('response.'+response.data.errno)
              })
            })
    },
    handleDelete(row) {
      this.$api('admin.deleteAdmin',row)
        .then(response => {
            if(!response.errno){
                this.$notify.success({
                  title: this.$t('util.success'),
                  message: this.$t('systemManagement.updateAdministratorSucceeded')
                })
              }
              else{
                this.$notify.error({
                title: this.$t('util.fail'),
                message: this.$t('response.'+response.data.errno)
              })
              }
          this.getList()
        })
        .catch(response => {
          this.$notify.error({
            title: this.$t('util.fail'),
            message: this.$t('response.'+response.data.errno)
          })
        })
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = [this.$t('systemManagement.administratorID'),this.$t('systemManagement.administratorName'), this.$t('systemManagement.administratorAvatar')]
        const filterVal = ['id', 'username', 'avatar']
        excel.export_json_to_excel2(
          tHeader,
          this.list,
          filterVal,
          this.$t('systemManagement.administratorInformation')
        )
        this.downloadLoading = false
      })
    }
  }
}
</script>
<style scoped>
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #20a0ff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}
.avatar {
  width: 145px;
  height: 145px;
  display: block;
}
.width-200px{
  width:200px;
}
.mr-20px{
  margin-right: 20px;
}
.dataFormClass{
  width: 400px; margin-left:50px;
}
</style>


