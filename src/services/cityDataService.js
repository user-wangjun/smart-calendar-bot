/**
 * 城市数据服务
 * 提供中国主要城市数据，支持搜索和筛选功能
 * 支持省 > 市 > 区 三级级联选择
 */

/**
 * 中国主要城市数据列表
 * 包含城市名称、城市编码(adcode)、省份信息、区县列表
 */
const CHINA_CITIES = [
  // 直辖市
  {
    name: '北京市',
    adcode: '110000',
    province: '北京市',
    pinyin: 'beijing',
    districts: [
      { name: '东城区', adcode: '110101' },
      { name: '西城区', adcode: '110102' },
      { name: '朝阳区', adcode: '110105' },
      { name: '丰台区', adcode: '110106' },
      { name: '石景山区', adcode: '110107' },
      { name: '海淀区', adcode: '110108' },
      { name: '门头沟区', adcode: '110109' },
      { name: '房山区', adcode: '110111' },
      { name: '通州区', adcode: '110112' },
      { name: '顺义区', adcode: '110113' },
      { name: '昌平区', adcode: '110114' },
      { name: '大兴区', adcode: '110115' },
      { name: '怀柔区', adcode: '110116' },
      { name: '平谷区', adcode: '110117' },
      { name: '密云区', adcode: '110118' },
      { name: '延庆区', adcode: '110119' }
    ]
  },
  {
    name: '上海市',
    adcode: '310000',
    province: '上海市',
    pinyin: 'shanghai',
    districts: [
      { name: '黄浦区', adcode: '310101' },
      { name: '徐汇区', adcode: '310104' },
      { name: '长宁区', adcode: '310105' },
      { name: '静安区', adcode: '310106' },
      { name: '普陀区', adcode: '310107' },
      { name: '虹口区', adcode: '310109' },
      { name: '杨浦区', adcode: '310110' },
      { name: '浦东新区', adcode: '310115' },
      { name: '闵行区', adcode: '310112' },
      { name: '宝山区', adcode: '310113' },
      { name: '嘉定区', adcode: '310114' },
      { name: '金山区', adcode: '310116' },
      { name: '松江区', adcode: '310117' },
      { name: '青浦区', adcode: '310118' },
      { name: '奉贤区', adcode: '310120' },
      { name: '崇明区', adcode: '310151' }
    ]
  },
  {
    name: '天津市',
    adcode: '120000',
    province: '天津市',
    pinyin: 'tianjin',
    districts: [
      { name: '和平区', adcode: '120101' },
      { name: '河东区', adcode: '120102' },
      { name: '河西区', adcode: '120103' },
      { name: '南开区', adcode: '120104' },
      { name: '河北区', adcode: '120105' },
      { name: '红桥区', adcode: '120106' },
      { name: '东丽区', adcode: '120110' },
      { name: '西青区', adcode: '120111' },
      { name: '津南区', adcode: '120112' },
      { name: '北辰区', adcode: '120113' },
      { name: '武清区', adcode: '120114' },
      { name: '宝坻区', adcode: '120115' },
      { name: '滨海新区', adcode: '120116' },
      { name: '宁河区', adcode: '120117' },
      { name: '静海区', adcode: '120118' },
      { name: '蓟州区', adcode: '120119' }
    ]
  },
  {
    name: '重庆市',
    adcode: '500000',
    province: '重庆市',
    pinyin: 'chongqing',
    districts: [
      { name: '万州区', adcode: '500101' },
      { name: '涪陵区', adcode: '500102' },
      { name: '渝中区', adcode: '500103' },
      { name: '大渡口区', adcode: '500104' },
      { name: '江北区', adcode: '500105' },
      { name: '沙坪坝区', adcode: '500106' },
      { name: '九龙坡区', adcode: '500107' },
      { name: '南岸区', adcode: '500108' },
      { name: '北碚区', adcode: '500109' },
      { name: '渝北区', adcode: '500112' },
      { name: '巴南区', adcode: '500113' },
      { name: '长寿区', adcode: '500115' },
      { name: '江津区', adcode: '500116' },
      { name: '合川区', adcode: '500117' },
      { name: '永川区', adcode: '500118' },
      { name: '南川区', adcode: '500119' },
      { name: '璧山区', adcode: '500120' },
      { name: '铜梁区', adcode: '500151' },
      { name: '潼南区', adcode: '500152' },
      { name: '荣昌区', adcode: '500153' },
      { name: '开州区', adcode: '500154' },
      { name: '梁平区', adcode: '500155' },
      { name: '武隆区', adcode: '500156' }
    ]
  },

  // 广东省
  {
    name: '广州市',
    adcode: '440100',
    province: '广东省',
    pinyin: 'guangzhou',
    districts: [
      { name: '荔湾区', adcode: '440103' },
      { name: '越秀区', adcode: '440104' },
      { name: '海珠区', adcode: '440105' },
      { name: '天河区', adcode: '440106' },
      { name: '白云区', adcode: '440111' },
      { name: '黄埔区', adcode: '440112' },
      { name: '番禺区', adcode: '440113' },
      { name: '花都区', adcode: '440114' },
      { name: '南沙区', adcode: '440115' },
      { name: '从化区', adcode: '440117' },
      { name: '增城区', adcode: '440118' }
    ]
  },
  {
    name: '深圳市',
    adcode: '440300',
    province: '广东省',
    pinyin: 'shenzhen',
    districts: [
      { name: '罗湖区', adcode: '440303' },
      { name: '福田区', adcode: '440304' },
      { name: '南山区', adcode: '440305' },
      { name: '宝安区', adcode: '440306' },
      { name: '龙岗区', adcode: '440307' },
      { name: '盐田区', adcode: '440308' },
      { name: '龙华区', adcode: '440309' },
      { name: '坪山区', adcode: '440310' },
      { name: '光明区', adcode: '440311' }
    ]
  },
  {
    name: '珠海市',
    adcode: '440400',
    province: '广东省',
    pinyin: 'zhuhai',
    districts: [
      { name: '香洲区', adcode: '440402' },
      { name: '斗门区', adcode: '440403' },
      { name: '金湾区', adcode: '440404' }
    ]
  },
  {
    name: '韶关市',
    adcode: '440200',
    province: '广东省',
    pinyin: 'shaoguan',
    districts: [
      { name: '武江区', adcode: '440203' },
      { name: '浈江区', adcode: '440204' },
      { name: '曲江区', adcode: '440205' },
      { name: '始兴县', adcode: '440222' },
      { name: '仁化县', adcode: '440224' },
      { name: '翁源县', adcode: '440229' },
      { name: '乳源瑶族自治县', adcode: '440232' },
      { name: '新丰县', adcode: '440233' },
      { name: '乐昌市', adcode: '440281' },
      { name: '南雄市', adcode: '440282' }
    ]
  },

  // 江苏省
  {
    name: '南京市',
    adcode: '320100',
    province: '江苏省',
    pinyin: 'nanjing',
    districts: [
      { name: '玄武区', adcode: '320102' },
      { name: '秦淮区', adcode: '320104' },
      { name: '建邺区', adcode: '320105' },
      { name: '鼓楼区', adcode: '320106' },
      { name: '浦口区', adcode: '320111' },
      { name: '栖霞区', adcode: '320113' },
      { name: '雨花台区', adcode: '320114' },
      { name: '江宁区', adcode: '320115' },
      { name: '六合区', adcode: '320116' },
      { name: '溧水区', adcode: '320117' },
      { name: '高淳区', adcode: '320118' }
    ]
  },
  {
    name: '苏州市',
    adcode: '320500',
    province: '江苏省',
    pinyin: 'suzhou',
    districts: [
      { name: '虎丘区', adcode: '320505' },
      { name: '吴中区', adcode: '320506' },
      { name: '相城区', adcode: '320507' },
      { name: '姑苏区', adcode: '320508' },
      { name: '吴江区', adcode: '320509' },
      { name: '常熟市', adcode: '320581' },
      { name: '张家港市', adcode: '320582' },
      { name: '昆山市', adcode: '320583' },
      { name: '太仓市', adcode: '320585' }
    ]
  },

  // 浙江省
  {
    name: '杭州市',
    adcode: '330100',
    province: '浙江省',
    pinyin: 'hangzhou',
    districts: [
      { name: '上城区', adcode: '330102' },
      { name: '拱墅区', adcode: '330105' },
      { name: '西湖区', adcode: '330106' },
      { name: '滨江区', adcode: '330108' },
      { name: '萧山区', adcode: '330109' },
      { name: '余杭区', adcode: '330110' },
      { name: '富阳区', adcode: '330111' },
      { name: '临安区', adcode: '330112' },
      { name: '临平区', adcode: '330113' },
      { name: '钱塘区', adcode: '330114' },
      { name: '桐庐县', adcode: '330122' },
      { name: '淳安县', adcode: '330127' },
      { name: '建德市', adcode: '330182' }
    ]
  },
  {
    name: '宁波市',
    adcode: '330200',
    province: '浙江省',
    pinyin: 'ningbo',
    districts: [
      { name: '海曙区', adcode: '330203' },
      { name: '江北区', adcode: '330205' },
      { name: '北仑区', adcode: '330206' },
      { name: '镇海区', adcode: '330211' },
      { name: '鄞州区', adcode: '330212' },
      { name: '奉化区', adcode: '330213' },
      { name: '象山县', adcode: '330225' },
      { name: '宁海县', adcode: '330226' },
      { name: '余姚市', adcode: '330281' },
      { name: '慈溪市', adcode: '330282' }
    ]
  },

  // 四川省
  {
    name: '成都市',
    adcode: '510100',
    province: '四川省',
    pinyin: 'chengdu',
    districts: [
      { name: '锦江区', adcode: '510104' },
      { name: '青羊区', adcode: '510105' },
      { name: '金牛区', adcode: '510106' },
      { name: '武侯区', adcode: '510107' },
      { name: '成华区', adcode: '510108' },
      { name: '龙泉驿区', adcode: '510112' },
      { name: '青白江区', adcode: '510113' },
      { name: '新都区', adcode: '510114' },
      { name: '温江区', adcode: '510115' },
      { name: '双流区', adcode: '510116' },
      { name: '郫都区', adcode: '510117' },
      { name: '新津区', adcode: '510118' },
      { name: '金堂县', adcode: '510121' },
      { name: '大邑县', adcode: '510129' },
      { name: '蒲江县', adcode: '510131' },
      { name: '都江堰市', adcode: '510181' },
      { name: '彭州市', adcode: '510182' },
      { name: '邛崃市', adcode: '510183' },
      { name: '崇州市', adcode: '510184' },
      { name: '简阳市', adcode: '510185' }
    ]
  },

  // 湖北省
  {
    name: '武汉市',
    adcode: '420100',
    province: '湖北省',
    pinyin: 'wuhan',
    districts: [
      { name: '江岸区', adcode: '420102' },
      { name: '江汉区', adcode: '420103' },
      { name: '硚口区', adcode: '420104' },
      { name: '汉阳区', adcode: '420105' },
      { name: '武昌区', adcode: '420106' },
      { name: '青山区', adcode: '420107' },
      { name: '洪山区', adcode: '420111' },
      { name: '东西湖区', adcode: '420112' },
      { name: '汉南区', adcode: '420113' },
      { name: '蔡甸区', adcode: '420114' },
      { name: '江夏区', adcode: '420115' },
      { name: '黄陂区', adcode: '420116' },
      { name: '新洲区', adcode: '420117' }
    ]
  },

  // 陕西省
  {
    name: '西安市',
    adcode: '610100',
    province: '陕西省',
    pinyin: 'xian',
    districts: [
      { name: '新城区', adcode: '610102' },
      { name: '碑林区', adcode: '610103' },
      { name: '莲湖区', adcode: '610104' },
      { name: '灞桥区', adcode: '610111' },
      { name: '未央区', adcode: '610112' },
      { name: '雁塔区', adcode: '610113' },
      { name: '阎良区', adcode: '610114' },
      { name: '临潼区', adcode: '610115' },
      { name: '长安区', adcode: '610116' },
      { name: '高陵区', adcode: '610117' },
      { name: '鄠邑区', adcode: '610118' },
      { name: '蓝田县', adcode: '610122' },
      { name: '周至县', adcode: '610124' }
    ]
  }
];

/**
 * 中国所有省份/直辖市/自治区/特别行政区列表
 * 用于完整的省份选择功能
 */
const ALL_PROVINCES = [
  // 直辖市
  '北京市',
  '上海市',
  '天津市',
  '重庆市',
  // 省
  '河北省',
  '山西省',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '海南省',
  '四川省',
  '贵州省',
  '云南省',
  '陕西省',
  '甘肃省',
  '青海省',
  '台湾省',
  // 自治区
  '内蒙古自治区',
  '广西壮族自治区',
  '西藏自治区',
  '宁夏回族自治区',
  '新疆维吾尔自治区',
  // 特别行政区
  '香港特别行政区',
  '澳门特别行政区'
];

/**
 * 省份对应的城市数据（用于没有详细城市数据的省份）
 * 包含省会城市和主要城市
 */
const PROVINCE_CITIES_MAP = {
  河北省: [
    { name: '石家庄市', adcode: '130100' },
    { name: '唐山市', adcode: '130200' },
    { name: '秦皇岛市', adcode: '130300' },
    { name: '邯郸市', adcode: '130400' },
    { name: '邢台市', adcode: '130500' },
    { name: '保定市', adcode: '130600' },
    { name: '张家口市', adcode: '130700' },
    { name: '承德市', adcode: '130800' },
    { name: '沧州市', adcode: '130900' },
    { name: '廊坊市', adcode: '131000' },
    { name: '衡水市', adcode: '131100' }
  ],
  山西省: [
    { name: '太原市', adcode: '140100' },
    { name: '大同市', adcode: '140200' },
    { name: '阳泉市', adcode: '140300' },
    { name: '长治市', adcode: '140400' },
    { name: '晋城市', adcode: '140500' },
    { name: '朔州市', adcode: '140600' },
    { name: '晋中市', adcode: '140700' },
    { name: '运城市', adcode: '140800' },
    { name: '忻州市', adcode: '140900' },
    { name: '临汾市', adcode: '141000' },
    { name: '吕梁市', adcode: '141100' }
  ],
  辽宁省: [
    { name: '沈阳市', adcode: '210100' },
    { name: '大连市', adcode: '210200' },
    { name: '鞍山市', adcode: '210300' },
    { name: '抚顺市', adcode: '210400' },
    { name: '本溪市', adcode: '210500' },
    { name: '丹东市', adcode: '210600' },
    { name: '锦州市', adcode: '210700' },
    { name: '营口市', adcode: '210800' },
    { name: '阜新市', adcode: '210900' },
    { name: '辽阳市', adcode: '211000' },
    { name: '盘锦市', adcode: '211100' },
    { name: '铁岭市', adcode: '211200' },
    { name: '朝阳市', adcode: '211300' },
    { name: '葫芦岛市', adcode: '211400' }
  ],
  吉林省: [
    { name: '长春市', adcode: '220100' },
    { name: '吉林市', adcode: '220200' },
    { name: '四平市', adcode: '220300' },
    { name: '辽源市', adcode: '220400' },
    { name: '通化市', adcode: '220500' },
    { name: '白山市', adcode: '220600' },
    { name: '松原市', adcode: '220700' },
    { name: '白城市', adcode: '220800' },
    { name: '延边朝鲜族自治州', adcode: '222400' }
  ],
  黑龙江省: [
    { name: '哈尔滨市', adcode: '230100' },
    { name: '齐齐哈尔市', adcode: '230200' },
    { name: '鸡西市', adcode: '230300' },
    { name: '鹤岗市', adcode: '230400' },
    { name: '双鸭山市', adcode: '230500' },
    { name: '大庆市', adcode: '230600' },
    { name: '伊春市', adcode: '230700' },
    { name: '佳木斯市', adcode: '230800' },
    { name: '七台河市', adcode: '230900' },
    { name: '牡丹江市', adcode: '231000' },
    { name: '黑河市', adcode: '231100' },
    { name: '绥化市', adcode: '231200' },
    { name: '大兴安岭地区', adcode: '232700' }
  ],
  安徽省: [
    { name: '合肥市', adcode: '340100' },
    { name: '芜湖市', adcode: '340200' },
    { name: '蚌埠市', adcode: '340300' },
    { name: '淮南市', adcode: '340400' },
    { name: '马鞍山市', adcode: '340500' },
    { name: '淮北市', adcode: '340600' },
    { name: '铜陵市', adcode: '340700' },
    { name: '安庆市', adcode: '340800' },
    { name: '黄山市', adcode: '341000' },
    { name: '滁州市', adcode: '341100' },
    { name: '阜阳市', adcode: '341200' },
    { name: '宿州市', adcode: '341300' },
    { name: '六安市', adcode: '341500' },
    { name: '亳州市', adcode: '341600' },
    { name: '池州市', adcode: '341700' },
    { name: '宣城市', adcode: '341800' }
  ],
  福建省: [
    { name: '福州市', adcode: '350100' },
    { name: '厦门市', adcode: '350200' },
    { name: '莆田市', adcode: '350300' },
    { name: '三明市', adcode: '350400' },
    { name: '泉州市', adcode: '350500' },
    { name: '漳州市', adcode: '350600' },
    { name: '南平市', adcode: '350700' },
    { name: '龙岩市', adcode: '350800' },
    { name: '宁德市', adcode: '350900' }
  ],
  江西省: [
    { name: '南昌市', adcode: '360100' },
    { name: '景德镇市', adcode: '360200' },
    { name: '萍乡市', adcode: '360300' },
    { name: '九江市', adcode: '360400' },
    { name: '新余市', adcode: '360500' },
    { name: '鹰潭市', adcode: '360600' },
    { name: '赣州市', adcode: '360700' },
    { name: '吉安市', adcode: '360800' },
    { name: '宜春市', adcode: '360900' },
    { name: '抚州市', adcode: '361000' },
    { name: '上饶市', adcode: '361100' }
  ],
  山东省: [
    { name: '济南市', adcode: '370100' },
    { name: '青岛市', adcode: '370200' },
    { name: '淄博市', adcode: '370300' },
    { name: '枣庄市', adcode: '370400' },
    { name: '东营市', adcode: '370500' },
    { name: '烟台市', adcode: '370600' },
    { name: '潍坊市', adcode: '370700' },
    { name: '济宁市', adcode: '370800' },
    { name: '泰安市', adcode: '370900' },
    { name: '威海市', adcode: '371000' },
    { name: '日照市', adcode: '371100' },
    { name: '临沂市', adcode: '371300' },
    { name: '德州市', adcode: '371400' },
    { name: '聊城市', adcode: '371500' },
    { name: '滨州市', adcode: '371600' },
    { name: '菏泽市', adcode: '371700' }
  ],
  河南省: [
    { name: '郑州市', adcode: '410100' },
    { name: '开封市', adcode: '410200' },
    { name: '洛阳市', adcode: '410300' },
    { name: '平顶山市', adcode: '410400' },
    { name: '安阳市', adcode: '410500' },
    { name: '鹤壁市', adcode: '410600' },
    { name: '新乡市', adcode: '410700' },
    { name: '焦作市', adcode: '410800' },
    { name: '濮阳市', adcode: '410900' },
    { name: '许昌市', adcode: '411000' },
    { name: '漯河市', adcode: '411100' },
    { name: '三门峡市', adcode: '411200' },
    { name: '南阳市', adcode: '411300' },
    { name: '商丘市', adcode: '411400' },
    { name: '信阳市', adcode: '411500' },
    { name: '周口市', adcode: '411600' },
    { name: '驻马店市', adcode: '411700' }
  ],
  湖南省: [
    { name: '长沙市', adcode: '430100' },
    { name: '株洲市', adcode: '430200' },
    { name: '湘潭市', adcode: '430300' },
    { name: '衡阳市', adcode: '430400' },
    { name: '邵阳市', adcode: '430500' },
    { name: '岳阳市', adcode: '430600' },
    { name: '常德市', adcode: '430700' },
    { name: '张家界市', adcode: '430800' },
    { name: '益阳市', adcode: '430900' },
    { name: '郴州市', adcode: '431000' },
    { name: '永州市', adcode: '431100' },
    { name: '怀化市', adcode: '431200' },
    { name: '娄底市', adcode: '431300' },
    { name: '湘西土家族苗族自治州', adcode: '433100' }
  ],
  海南省: [
    { name: '海口市', adcode: '460100' },
    { name: '三亚市', adcode: '460200' },
    { name: '三沙市', adcode: '460300' },
    { name: '儋州市', adcode: '460400' }
  ],
  贵州省: [
    { name: '贵阳市', adcode: '520100' },
    { name: '六盘水市', adcode: '520200' },
    { name: '遵义市', adcode: '520300' },
    { name: '安顺市', adcode: '520400' },
    { name: '毕节市', adcode: '520500' },
    { name: '铜仁市', adcode: '520600' },
    { name: '黔西南布依族苗族自治州', adcode: '522300' },
    { name: '黔东南苗族侗族自治州', adcode: '522600' },
    { name: '黔南布依族苗族自治州', adcode: '522700' }
  ],
  云南省: [
    { name: '昆明市', adcode: '530100' },
    { name: '曲靖市', adcode: '530300' },
    { name: '玉溪市', adcode: '530400' },
    { name: '保山市', adcode: '530500' },
    { name: '昭通市', adcode: '530600' },
    { name: '丽江市', adcode: '530700' },
    { name: '普洱市', adcode: '530800' },
    { name: '临沧市', adcode: '530900' },
    { name: '楚雄彝族自治州', adcode: '532300' },
    { name: '红河哈尼族彝族自治州', adcode: '532500' },
    { name: '文山壮族苗族自治州', adcode: '532600' },
    { name: '西双版纳傣族自治州', adcode: '532800' },
    { name: '大理白族自治州', adcode: '532900' },
    { name: '德宏傣族景颇族自治州', adcode: '533100' },
    { name: '怒江傈僳族自治州', adcode: '533300' },
    { name: '迪庆藏族自治州', adcode: '533400' }
  ],
  甘肃省: [
    { name: '兰州市', adcode: '620100' },
    { name: '嘉峪关市', adcode: '620200' },
    { name: '金昌市', adcode: '620300' },
    { name: '白银市', adcode: '620400' },
    { name: '天水市', adcode: '620500' },
    { name: '武威市', adcode: '620600' },
    { name: '张掖市', adcode: '620700' },
    { name: '平凉市', adcode: '620800' },
    { name: '酒泉市', adcode: '620900' },
    { name: '庆阳市', adcode: '621000' },
    { name: '定西市', adcode: '621100' },
    { name: '陇南市', adcode: '621200' },
    { name: '临夏回族自治州', adcode: '622900' },
    { name: '甘南藏族自治州', adcode: '623000' }
  ],
  青海省: [
    { name: '西宁市', adcode: '630100' },
    { name: '海东市', adcode: '630200' },
    { name: '海北藏族自治州', adcode: '632200' },
    { name: '黄南藏族自治州', adcode: '632300' },
    { name: '海南藏族自治州', adcode: '632500' },
    { name: '果洛藏族自治州', adcode: '632600' },
    { name: '玉树藏族自治州', adcode: '632700' },
    { name: '海西蒙古族藏族自治州', adcode: '632800' }
  ],
  台湾省: [
    { name: '台北市', adcode: '710100' },
    { name: '高雄市', adcode: '710200' },
    { name: '台南市', adcode: '710300' },
    { name: '台中市', adcode: '710400' },
    { name: '桃园市', adcode: '710500' },
    { name: '基隆市', adcode: '710700' },
    { name: '新竹市', adcode: '710800' },
    { name: '嘉义市', adcode: '710900' }
  ],
  内蒙古自治区: [
    { name: '呼和浩特市', adcode: '150100' },
    { name: '包头市', adcode: '150200' },
    { name: '乌海市', adcode: '150300' },
    { name: '赤峰市', adcode: '150400' },
    { name: '通辽市', adcode: '150500' },
    { name: '鄂尔多斯市', adcode: '150600' },
    { name: '呼伦贝尔市', adcode: '150700' },
    { name: '巴彦淖尔市', adcode: '150800' },
    { name: '乌兰察布市', adcode: '150900' },
    { name: '兴安盟', adcode: '152200' },
    { name: '锡林郭勒盟', adcode: '152500' },
    { name: '阿拉善盟', adcode: '152900' }
  ],
  广西壮族自治区: [
    { name: '南宁市', adcode: '450100' },
    { name: '柳州市', adcode: '450200' },
    { name: '桂林市', adcode: '450300' },
    { name: '梧州市', adcode: '450400' },
    { name: '北海市', adcode: '450500' },
    { name: '防城港市', adcode: '450600' },
    { name: '钦州市', adcode: '450700' },
    { name: '贵港市', adcode: '450800' },
    { name: '玉林市', adcode: '450900' },
    { name: '百色市', adcode: '451000' },
    { name: '贺州市', adcode: '451100' },
    { name: '河池市', adcode: '451200' },
    { name: '来宾市', adcode: '451300' },
    { name: '崇左市', adcode: '451400' }
  ],
  西藏自治区: [
    { name: '拉萨市', adcode: '540100' },
    { name: '日喀则市', adcode: '540200' },
    { name: '昌都市', adcode: '540300' },
    { name: '林芝市', adcode: '540400' },
    { name: '山南市', adcode: '540500' },
    { name: '那曲市', adcode: '540600' },
    { name: '阿里地区', adcode: '542500' }
  ],
  宁夏回族自治区: [
    { name: '银川市', adcode: '640100' },
    { name: '石嘴山市', adcode: '640200' },
    { name: '吴忠市', adcode: '640300' },
    { name: '固原市', adcode: '640400' },
    { name: '中卫市', adcode: '640500' }
  ],
  新疆维吾尔自治区: [
    { name: '乌鲁木齐市', adcode: '650100' },
    { name: '克拉玛依市', adcode: '650200' },
    { name: '吐鲁番市', adcode: '650400' },
    { name: '哈密市', adcode: '650500' },
    { name: '昌吉回族自治州', adcode: '652300' },
    { name: '博尔塔拉蒙古自治州', adcode: '652700' },
    { name: '巴音郭楞蒙古自治州', adcode: '652800' },
    { name: '阿克苏地区', adcode: '652900' },
    { name: '克孜勒苏柯尔克孜自治州', adcode: '653000' },
    { name: '喀什地区', adcode: '653100' },
    { name: '和田地区', adcode: '653200' },
    { name: '伊犁哈萨克自治州', adcode: '654000' },
    { name: '塔城地区', adcode: '654200' },
    { name: '阿勒泰地区', adcode: '654300' }
  ],
  香港特别行政区: [
    { name: '香港岛', adcode: '810100' },
    { name: '九龙', adcode: '810200' },
    { name: '新界', adcode: '810300' }
  ],
  澳门特别行政区: [
    { name: '澳门半岛', adcode: '820100' },
    { name: '氹仔', adcode: '820200' },
    { name: '路环', adcode: '820300' }
  ]
};

/**
 * 热门城市列表（用于快速选择）
 */
const HOT_CITIES = [
  '北京市',
  '上海市',
  '广州市',
  '深圳市',
  '杭州市',
  '南京市',
  '成都市',
  '武汉市',
  '西安市',
  '重庆市'
];

/**
 * 城市数据服务类
 * 支持省 > 市 > 区 三级级联选择
 */
class CityDataService {
  constructor () {
    this.cities = CHINA_CITIES;
    this.hotCities = HOT_CITIES;
    this.allProvinces = ALL_PROVINCES;
    this.provinceCitiesMap = PROVINCE_CITIES_MAP;
  }

  /**
   * 获取所有城市列表
   * @returns {Array} 城市列表
   */
  getAllCities () {
    return this.cities;
  }

  /**
   * 获取热门城市列表
   * @returns {Array} 热门城市列表
   */
  getHotCities () {
    return this.cities.filter(city => this.hotCities.includes(city.name));
  }

  /**
   * 根据城市名称搜索城市
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的城市列表
   */
  searchCities (keyword) {
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    const lowerKeyword = keyword.toLowerCase().trim();

    return this.cities.filter(city => {
      // 匹配城市名称
      if (city.name.includes(lowerKeyword)) {
        return true;
      }
      // 匹配拼音
      if (city.pinyin && city.pinyin.includes(lowerKeyword)) {
        return true;
      }
      // 匹配省份
      if (city.province.includes(lowerKeyword)) {
        return true;
      }
      // 匹配区县
      if (city.districts && city.districts.some(d => d.name.includes(lowerKeyword))) {
        return true;
      }
      return false;
    });
  }

  /**
   * 根据城市编码获取城市信息
   * @param {string} adcode - 城市编码
   * @returns {Object|null} 城市信息
   */
  getCityByAdcode (adcode) {
    return this.cities.find(city => city.adcode === adcode) || null;
  }

  /**
   * 根据城市名称获取城市信息
   * @param {string} name - 城市名称
   * @returns {Object|null} 城市信息
   */
  getCityByName (name) {
    return this.cities.find(city => city.name === name) || null;
  }

  /**
   * 按省份分组获取城市列表
   * @returns {Object} 按省份分组的城市列表
   */
  getCitiesByProvince () {
    const grouped = {};

    this.cities.forEach(city => {
      if (!grouped[city.province]) {
        grouped[city.province] = [];
      }
      grouped[city.province].push(city);
    });

    return grouped;
  }

  /**
   * 获取所有省份列表
   * @returns {Array} 省份列表（包含所有34个省级行政区）
   */
  getProvinces () {
    return this.allProvinces;
  }

  /**
   * 根据省份获取城市列表
   * @param {string} province - 省份名称
   * @returns {Array} 城市列表
   */
  getCitiesByProvinceName (province) {
    // 首先尝试从主城市数据中获取
    const citiesFromMainData = this.cities.filter(city => city.province === province);
    if (citiesFromMainData.length > 0) {
      return citiesFromMainData;
    }

    // 如果主数据中没有，从补充数据中获取
    return this.provinceCitiesMap[province] || [];
  }

  /**
   * 根据城市编码获取区县列表
   * @param {string} cityAdcode - 城市编码
   * @returns {Array} 区县列表
   */
  getDistrictsByCity (cityAdcode) {
    const city = this.getCityByAdcode(cityAdcode);
    return city?.districts || [];
  }

  /**
   * 根据城市名称获取区县列表
   * @param {string} cityName - 城市名称
   * @returns {Array} 区县列表
   */
  getDistrictsByCityName (cityName) {
    const city = this.getCityByName(cityName);
    return city?.districts || [];
  }

  /**
   * 根据区县编码获取区县信息
   * @param {string} districtAdcode - 区县编码
   * @returns {Object|null} 区县信息
   */
  getDistrictByAdcode (districtAdcode) {
    for (const city of this.cities) {
      if (city.districts) {
        const district = city.districts.find(d => d.adcode === districtAdcode);
        if (district) {
          return {
            ...district,
            city: city.name,
            cityAdcode: city.adcode,
            province: city.province
          };
        }
      }
    }
    return null;
  }

  /**
   * 搜索区县
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的区县列表
   */
  searchDistricts (keyword) {
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    const lowerKeyword = keyword.toLowerCase().trim();
    const results = [];

    this.cities.forEach(city => {
      if (city.districts) {
        city.districts.forEach(district => {
          if (district.name.includes(lowerKeyword)) {
            results.push({
              ...district,
              city: city.name,
              cityAdcode: city.adcode,
              province: city.province
            });
          }
        });
      }
    });

    return results;
  }

  /**
   * 获取完整位置信息
   * @param {string} province - 省份
   * @param {string} city - 城市
   * @param {string} district - 区县（可选）
   * @returns {Object} 完整位置信息
   */
  getFullLocation (province, city, district = null) {
    const cityInfo = this.getCityByName(city);
    if (!cityInfo) {
      return null;
    }

    const result = {
      province: cityInfo.province,
      city: cityInfo.name,
      cityAdcode: cityInfo.adcode
    };

    if (district && cityInfo.districts) {
      const districtInfo = cityInfo.districts.find(d => d.name === district);
      if (districtInfo) {
        result.district = districtInfo.name;
        result.districtAdcode = districtInfo.adcode;
      }
    }

    return result;
  }
}

// 创建单例实例
const cityDataService = new CityDataService();

export default cityDataService;
export { CityDataService, CHINA_CITIES, HOT_CITIES };
