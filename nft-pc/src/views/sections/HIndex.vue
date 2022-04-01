<template>
  <div class="carousel-section">
    <el-image
      class="banner-img"
      :src="banner"
      :fit="'fill'"
    ></el-image>
    <div class="banner-context main-wrapper">
      <div class="tip">{{ $t('home.tip1')}}</div>
      <div class="tip">{{ $t('home.tip2') }}</div>
    </div>
  </div>
  <div class="main-wrapper">
    <div class="search-options">
      <div class="nft-sorts">
        <div class="nft-sorts-item"
          :class="sortKey == 'update_time' ? 'active' : ''"
          @click="seleteSort('update_time')"
        >
          <span class="text">{{ $t("hindex.time") }}</span>
          <template v-if="sortKey == 'update_time'">
            <img
              v-if="sortValue == 'desc'"
              class="sort-icon"
              src="@/assets/img/sort_desc.png"
            />
            <img
              v-else
              class="sort-icon"
              src="@/assets/img/sort_asc.png"
            />
          </template>
          <img v-else class="sort-icon" src="@/assets/img/no_sort.png" alt="" />
        </div>
        <filter-and-sort
          :filters="filters"
          :filterId="filterId"
          @selectFilter="selectFilter"
        >
        </filter-and-sort>
      </div>
    </div>
    <div v-for="(categoryName,i) in filters">
      <h1>{{categoryName.name}}</h1>
      <div class="new-nft-list" v-infinite-scroll="loadNftList">
        <div class="nft">
          <nft-item
              v-for="(nft, i) in nftList"
              :nft="nft"
              :key="i"
              :index="i"
              @showDialog="showDialog"
              @onLike="onLike"
              :categoryName="categoryName.id"
          >
          </nft-item>
<!--          <nft-item-load :loadStatus="loadStatus"></nft-item-load>-->
        </div>
      </div>
    </div>

    <sale-dialog
      :show="showSaleDialog"
      @close="closeDialog"
      @confirm="dialogConfirm"
      :asset="dialogOrder"
      :nft="dialogNft"
    >
    </sale-dialog>
    <cancel-sale-dialog
      :show="showCancelSaleDialog"
      @close="closeDialog"
      @confirm="dialogConfirm"
      :asset="dialogOrder"
      :nft="dialogNft"
    >
    </cancel-sale-dialog>
    <buy-dialog
      :show="showBuyDialog"
      @close="closeDialog"
      @confirm="dialogConfirm"
      :asset="dialogOrder"
      :nft="dialogNft"
    >
    </buy-dialog>

    <bid-dialog
      :show="showBidDialog"
      @close="closeDialog"
      @confirm="dialogConfirm"
      :bid="dialogOrder"
      :nft="dialogNft"
    >
    </bid-dialog>
    <cancel-bid-dialog
      :show="showCancelBidDialog"
      @close="closeDialog"
      @confirm="dialogConfirm"
      :bid="dialogOrder"
      :nft="dialogNft"
    >
    </cancel-bid-dialog>
    <accept-dialog
      :show="showAcceptDialog"
      @close="closeDialog"
      @confirm="dialogConfirm"
      :bid="dialogOrder"
      :nft="dialogNft"
    >
    </accept-dialog>
    <transfer-dialog
      :show="showTransferDialog"
      @close="closeDialog"
      @confirm="dialogConfirm"
      :asset="dialogOrder"
      :nft="dialogNft"
    >
    </transfer-dialog>
    <burn-dialog
      :show="showBurnDialog"
      @close="closeDialog"
      @confirm="dialogConfirm"
      :asset="dialogOrder"
      :nft="dialogNft"
    >
    </burn-dialog>
    <sale-type-dialog
      :show="showSaleTypeDialog"
      @close="closeDialog"
      @saleType="dialogSelect"
    ></sale-type-dialog>
  </div>
</template>
<script>
import FilterAndSort from "@/components/FilterAndSort";
import NftDialog from "@/mixins/NftDialog";
import NftItem from "@/mixins/NftItem";
import NftInfo from "@/mixins/NftInfo";

export default {
  name: "HIndex",
  components: {
    FilterAndSort,
  },
  mixins: [NftDialog, NftItem, NftInfo],
  data: function () {
    return {
      banner: require("@/assets/img/home/banner.jpg"),
      sortKey: "",
      filterId: "",
      filters: [],
      sortValue: "",
      nftList: [],
      query: {
        page: 1,
        limit: this.$store.state.pageLimit,
      },
      loadStatus: "",
      categoryName:"",
    };
  },
  created() {
    this.init();
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
  },
  methods: {
    reloadList() {
      this.query.page = 1;
      this.getNftList();
    },
    async init() {
      this.getFilters();
      this.getNftList();
    },
    selectFilter(filterId) {
      this.filterId = this.filterId == filterId ? "" : filterId;
      this.query.page = 1;
      this.getNftList();
      console.log(this.filters)
      // for (var i = 0; i < this.filters.length; i++) {
      //   let filter = this.filters[i];
      //   if (filter.id == filterId) {
      //     this.categoryName=filter.name;
      //   }
      // }
    },
    getFilters() {
      this.$api("category.list").then((res) => {
        if (this.$tools.checkResponse(res)) {
          this.filters = res.data;
        }
      });
    },
    seleteSort(sort) {
      if (this.sortKey == sort) {
        this.sortValue = this.sortValue == "asc" ? "desc" : "asc";
      } else {
        this.sortKey = sort;
        this.sortValue = "desc";
      }
      this.query.page = 1;
      this.getNftList();
    },
    loadNftList() {
      if (this.loadStatus == "over") return;
      this.getNftList();
    },
    getNftList() {
      if (this.loadStatus == "loading") return;
      this.loadStatus = "loading";
      var data = {
        page: this.query.page,
        limit: this.query.limit,
        cate: this.filterId,
        sort: this.sortKey,
        order: this.sortValue,
      };
      this.$api("home.list", data).then((res) => {
        if (this.$tools.checkResponse(res)) {
          console.log(res)
          if (data.page == 1) this.nftList = [];
          this.nftList = this.nftList.concat(res.data.list);
          // console.log(JSON.parse(JSON.stringify(this.nftList[0])).nft.id);
          this.queryFunction(res.data.list);
          if (res.data.list.length < data.limit) {
            this.loadStatus = "over";
          } else {
            this.query.page += 1;
            this.loadStatus = "";
          }
        } else {
          this.$tools.message(res.errmsg);
        }
      });
    },
  },
};
</script>
<style lang="scss" scoped>
@media screen and (max-width: 992px) {
  .search-options {
    margin-top: 100px!important;
  }
  .banner-img {
    height: 140px!important;
  }
}
@media screen and (max-width: 550px) {
  .search-options {
    display: flex;
    flex-direction: unset;
  }
  .category-tags {
    background: #f4f4f4;
    border-radius: 5px;
    display: flex;
    margin-left: 0px;
    transform: inherit;
    justify-content: space-around;
  }
  .nft-sorts {
    display: flex;
    align-items: center;
    line-height: 18px;
  }
}
.sort-icon {
  width: 7px;
  height: 4px;
  margin-left: 5px;
}

.main-wrapper {
  padding-top: 0 !important;
}
.banner-img {
  width: 100%;
  height: auto;
}

.carousel-section {
  width: 100%;
  /*height:10%;*/
  position: relative;
  .banner-context{
    position: absolute;
    left: 0;
    right: 0;
    top: 150px;
  }
  .banner-title{
    width: 30%;
  }
  .tip{
    font-size: 16px;
    color: #3c4784;
    margin-top: 20px;
  }
}
.home-banner {
  padding-top: 60px;
  padding-bottom: 40px;
  background: #dce3eb;
}
.category-tags {
  display: flex;
}
.category-tags-item {
  background: none;
  border: none;
  color: #999;
  font-weight: bold;
  padding: 0;
  height: auto;
  margin: 0;
  margin-right: 20px;
  cursor: pointer;
  &.active {
    color: #333;
    border-bottom: 2px solid #333;
    border-radius: 0;
  }
}
.search-options {
  position: relative;
  display: flex;
  align-items: center;
  margin: 20px 0;
  justify-content: flex-end;
}
.nft-sorts {
  display: flex;
  align-items: center;
  line-height: 18px;
}
.nft-sorts-item {
  white-space: nowrap;
  display: flex;
  font-size: 13px;
  align-items: center;
  font-weight: 400;
  cursor: pointer;
  margin-right: 16px;
  .text {
    display: flex;
  }
  .sort-icon {
    display: flex;
    height: 13px;
    margin-left: 3px;
  }
  &.active {
    color: $primaryColor;
  }
}

.new-nft-list {
  margin: 0 -10px;
}
.nft{
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}





</style>


