<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { Search, Plus, Download, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import * as XLSX from 'xlsx'

// 拼音首字母映射表
const PINYIN_MAP: Record<string, string> = {
  'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g',
  'h': 'h', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o',
  'p': 'p', 'q': 'q', 'r': 'r', 's': 's', 't': 't', 'w': 'w', 'x': 'x',
  'y': 'y', 'z': 'z',
  '啊': 'a', '阿': 'a', '埃': 'a', '哎': 'a', '哀': 'a', '癌': 'a',
  '八': 'b', '巴': 'b', '吧': 'b', '百': 'b', '半': 'b', '帮': 'b', '宝': 'b',
  '苯': 'b', '比': 'b', '必': 'b', '碧': 'b', '便': 'b', '表': 'b', '别': 'b',
  '丙': 'b', '波': 'b', '博': 'b', '补': 'b', '布': 'b',
  '采': 'c', '财': 'c', '彩': 'c', '参': 'c', '藏': 'c', '操': 'c', '测': 'c',
  '层': 'c', '茶': 'c', '查': 'c', '柴': 'c', '缠': 'c', '产': 'c', '长': 'c',
  '肠': 'c', '常': 'c', '朝': 'c', '潮': 'c', '车': 'c', '沉': 'c', '陈': 'c',
  '趁': 'c', '撑': 'c', '成': 'c', '城': 'c', '吃': 'c', '迟': 'c', '持': 'c',
  '尺': 'c', '齿': 'c', '赤': 'c', '充': 'c', '虫': 'c', '重': 'c', '抽': 'c',
  '出': 'c', '初': 'c', '除': 'c', '处': 'c', '传': 'c', '创': 'c', '吹': 'c',
  '春': 'c', '纯': 'c', '磁': 'c', '此': 'c', '次': 'c', '聪': 'c', '从': 'c',
  '凑': 'c', '粗': 'c', '促': 'c', '催': 'c', '脆': 'c', '村': 'c', '存': 'c',
  '错': 'c', '达': 'd', '大': 'd', '代': 'd', '丹': 'd', '单': 'd', '胆': 'd',
  '淡': 'd', '蛋': 'd', '当': 'd', '刀': 'd', '导': 'd', '到': 'd', '道': 'd',
  '得': 'd', '的': 'd', '灯': 'd', '等': 'd', '低': 'd', '地': 'd', '第': 'd',
  '典': 'd', '点': 'd', '电': 'd', '垫': 'd', '碘': 'd', '淀': 'd', '刁': 'd',
  '调': 'd', '蝶': 'd', '丁': 'd', '叮': 'd', '钉': 'd', '顶': 'd', '定': 'd',
  '动': 'd', '都': 'd', '毒': 'd', '独': 'd', '肚': 'd', '度': 'd', '端': 'd',
  '短': 'd', '段': 'd', '断': 'd', '对': 'd', '顿': 'd', '多': 'd', '夺': 'd',
  '俄': 'e', '儿': 'e', '耳': 'e', '二': 'e',
  '发': 'f', '法': 'f', '翻': 'f', '凡': 'f', '烦': 'f', '反': 'f', '饭': 'f',
  '方': 'f', '防': 'f', '肥': 'f', '费': 'f', '分': 'f', '风': 'f', '疯': 'f',
  '蜂': 'f', '峰': 'f', '冯': 'f', '凤': 'f', '奉': 'f', '佛': 'f', '氟': 'f',
  '伏': 'f', '扶': 'f', '服': 'f', '福': 'f', '抚': 'f', '俯': 'f', '釜': 'f',
  '辅': 'f', '腐': 'f', '父': 'f', '腹': 'f', '富': 'f', '复': 'f', '副': 'f',
  '傅': 'f', '付': 'f', '妇': 'f', '附': 'f', '负': 'f', '芬': 'f', '酚': 'f',
  '呋': 'f', '肤': 'f', '孵': 'f', '弗': 'f', '拂': 'f', '复方': 'f',
  '甘': 'g', '干': 'g', '肝': 'g', '感': 'g', '高': 'g', '皋': 'g', '膏': 'g',
  '羔': 'g', '告': 'g', '哥': 'g', '歌': 'g', '割': 'g', '革': 'g', '格': 'g',
  '葛': 'g', '根': 'g', '更': 'g', '工': 'g', '公': 'g', '功': 'g', '宫': 'g',
  '恭': 'g', '狗': 'g', '构': 'g', '购': 'g', '骨': 'g', '谷': 'g', '鼓': 'g',
  '古': 'g', '固': 'g', '故': 'g', '瓜': 'g', '观': 'g', '冠': 'g', '光': 'g',
  '广': 'g', '归': 'g', '龟': 'g', '贵': 'g', '桂': 'g', '滚': 'g', '国': 'g',
  '果': 'g', '过': 'g', '哈': 'h', '孩': 'h', '海': 'h', '寒': 'h', '汗': 'h',
  '汉': 'h', '行': 'h', '豪': 'h', '好': 'h', '号': 'h', '浩': 'h', '喝': 'h',
  '何': 'h', '河': 'h', '核': 'h', '禾': 'h', '荷': 'h', '褐': 'h', '赫': 'h',
  '鹤': 'h', '黑': 'h', '很': 'h', '狠': 'h', '恨': 'h', '红': 'h', '宏': 'h',
  '洪': 'h', '虹': 'h', '喉': 'h', '候': 'h', '呼': 'h', '忽': 'h', '胡': 'h',
  '湖': 'h', '猴': 'h', '厚': 'h', '后': 'h', '乎': 'h', '虎': 'h',
  '互': 'h', '户': 'h', '护': 'h', '花': 'h', '华': 'h', '化': 'h', '画': 'h',
  '话': 'h', '淮': 'h', '环': 'h', '缓': 'h', '换': 'h', '唤': 'h', '患': 'h',
  '荒': 'h', '黄': 'h', '煌': 'h', '皇': 'h', '晃': 'h', '灰': 'h', '挥': 'h',
  '辉': 'h', '回': 'h', '毁': 'h', '汇': 'h', '会': 'h', '惠': 'h', '慧': 'h',
  '昏': 'h', '婚': 'h', '活': 'h', '火': 'h', '或': 'h', '货': 'h', '获': 'h',
  '祸': 'h', '惑': 'h', '霍': 'h', '肌': 'j', '鸡': 'j', '基': 'j', '激': 'j',
  '及': 'j', '吉': 'j', '级': 'j', '即': 'j', '急': 'j', '疾': 'j', '集': 'j',
  '脊': 'j', '己': 'j', '计': 'j', '记': 'j', '纪': 'j', '季': 'j', '既': 'j',
  '济': 'j', '继': 'j', '寄': 'j', '加': 'j', '家': 'j', '甲': 'j', '价': 'j',
  '假': 'j', '间': 'j', '坚': 'j', '决': 'j', '见': 'j', '建': 'j', '健': 'j',
  '江': 'j', '将': 'j', '降': 'j', '交': 'j', '胶': 'j', '教': 'j', '角': 'j',
  '脚': 'j', '洁': 'j', '节': 'j', '结': 'j', '解': 'j', '介': 'j', '戒': 'j',
  '界': 'j', '今': 'j', '金': 'j', '津': 'j', '紧': 'j', '锦': 'j', '尽': 'j',
  '进': 'j', '近': 'j', '禁': 'j', '京': 'j', '经': 'j', '精': 'j', '颈': 'j',
  '净': 'j', '竞': 'j', '敬': 'j', '静': 'j', '境': 'j', '镜': 'j', '纠': 'j',
  '究': 'j', '久': 'j', '九': 'j', '酒': 'j', '旧': 'j', '就': 'j', '居': 'j',
  '局': 'j', '菊': 'j', '举': 'j', '巨': 'j', '距': 'j', '具': 'j', '剧': 'j',
  '据': 'j', '聚': 'j', '决': 'j', '觉': 'j', '绝': 'j', '掘': 'j', '嚼': 'j',
  '军': 'j', '均': 'j', '菌': 'j', '开': 'k', '看': 'k', '康': 'k', '抗': 'k',
  '考': 'k', '靠': 'k', '科': 'k', '可': 'k', '克': 'k', '刻': 'k', '客': 'k',
  '口': 'k', '苦': 'k', '块': 'k', '快': 'k', '宽': 'k', '况': 'k', '矿': 'k',
  '困': 'k', '扩': 'k', '拉': 'l', '来': 'l', '蓝': 'l', '兰': 'l', '劳': 'l',
  '老': 'l', '乐': 'l', '雷': 'l', '类': 'l', '冷': 'l', '里': 'l', '理': 'l',
  '力': 'l', '历': 'l', '立': 'l', '丽': 'l', '利': 'l', '励': 'l', '例': 'l',
  '粒': 'l', '连': 'l', '联': 'l', '良': 'l', '凉': 'l', '两': 'l', '亮': 'l',
  '量': 'l', '疗': 'l', '林': 'l', '临': 'l', '淋': 'l', '磷': 'l', '灵': 'l',
  '铃': 'l', '凌': 'l', '另': 'l', '领': 'l', '流': 'l', '龙': 'l', '楼': 'l',
  '卢': 'l', '炉': 'l', '鲁': 'l', '陆': 'l', '录': 'l', '路': 'l', '驴': 'l',
  '旅': 'l', '绿': 'l', '律': 'l', '率': 'l', '滤': 'l', '氯': 'l', '卵': 'l',
  '乱': 'l', '略': 'l', '妈': 'm', '麻': 'm', '马': 'm', '码': 'm', '吗': 'm',
  '麦': 'm', '满': 'm', '慢': 'm', '忙': 'm', '毛': 'm', '猫': 'm',
  '毛': 'm', '茂': 'm', '冒': 'm', '贸': 'm', '梅': 'm', '媒': 'm', '酶': 'm',
  '美': 'm', '每': 'm', '门': 'm', '闷': 'm', '蒙': 'm', '猛': 'm', '梦': 'm',
  '迷': 'm', '米': 'm', '秘': 'm', '密': 'm', '棉': 'm', '免': 'm', '面': 'm',
  '苗': 'm', '描': 'm', '妙': 'm', '民': 'm', '敏': 'm', '名': 'm', '明': 'm',
  '命': 'm', '摸': 'm', '摩': 'm', '模': 'm', '膜': 'm', '磨': 'm', '魔': 'm',
  '末': 'm', '莫': 'm', '墨': 'm', '默': 'm', '谋': 'm', '某': 'm', '母': 'm',
  '木': 'm', '目': 'm', '慕': 'm', '穆': 'm', '拿': 'n', '那': 'n', '纳': 'n',
  '脑': 'n', '内': 'n', '嫩': 'n', '能': 'n', '尼': 'n', '你': 'n', '泥': 'n',
  '年': 'n', '念': 'n', '娘': 'n', '酿': 'n', '鸟': 'n', '尿': 'n', '您': 'n',
  '牛': 'n', '扭': 'n', '农': 'n', '浓': 'n', '女': 'n', '诺': 'n', '挪': 'n',
  '哦': 'o', '欧': 'o', '呕': 'o', '偶': 'o', '爬': 'p', '帕': 'p', '怕': 'p',
  '拍': 'p', '排': 'p', '盘': 'p', '旁': 'p', '胖': 'p', '跑': 'p', '泡': 'p',
  '陪': 'p', '培': 'p', '配': 'p', '喷': 'p', '盆': 'p', '碰': 'p', '批': 'p',
  '皮': 'p', '片': 'p', '漂': 'p', '票': 'p', '拼': 'p', '贫': 'p', '品': 'p',
  '平': 'p', '评': 'p', '苹': 'p', '屏': 'p', '婆': 'p', '迫': 'p', '破': 'p',
  '剖': 'p', '扑': 'p', '葡': 'p', '普': 'p', '谱': 'p', '漆': 'q', '期': 'q',
  '齐': 'q', '奇': 'q', '其': 'q', '骑': 'q', '棋': 'q', '旗': 'q', '起': 'q',
  '气': 'q', '弃': 'q', '汽': 'q', '恰': 'q', '千': 'q', '牵': 'q', '前': 'q',
  '钱': 'q', '潜': 'q', '浅': 'q', '强': 'q', '墙': 'q', '抢': 'q', '敲': 'q',
  '巧': 'q', '切': 'q', '亲': 'q', '秦': 'q', '青': 'q', '轻': 'q', '氢': 'q',
  '清': 'q', '情': 'q', '庆': 'q', '穷': 'q', '琼': 'q', '秋': 'q', '求': 'q',
  '球': 'q', '区': 'q', '曲': 'q', '驱': 'q', '屈': 'q', '取': 'q', '去': 'q',
  '权': 'q', '全': 'q', '泉': 'q', '缺': 'q', '确': 'q', '群': 'q', '然': 'r',
  '染': 'r', '让': 'r', '绕': 'r', '热': 'r', '人': 'r', '仁': 'r', '忍': 'r',
  '认': 'r', '任': 'r', '日': 'r', '荣': 'r', '容': 'r', '融': 'r', '肉': 'r',
  '如': 'r', '乳': 'r', '入': 'r', '软': 'r', '瑞': 'r', '润': 'r', '若': 'r',
  '弱': 'r', '撒': 's', '洒': 's', '塞': 's', '三': 's', '散': 's', '桑': 's',
  '扫': 's', '色': 's', '森': 's', '僧': 's', '杀': 's', '沙': 's', '纱': 's',
  '山': 's', '善': 's', '伤': 's', '商': 's', '上': 's', '尚': 's', '烧': 's',
  '少': 's', '绍': 's', '哨': 's', '舌': 's', '蛇': 's', '设': 's', '社': 's',
  '射': 's', '深': 's', '神': 's', '沈': 's', '肾': 's', '甚': 's', '升': 's',
  '生': 's', '声': 's', '省': 's', '圣': 's', '胜': 's', '师': 's', '失': 's',
  '诗': 's', '施': 's', '湿': 's', '十': 's', '石': 's', '时': 's', '识': 's',
  '实': 's', '食': 's', '史': 's', '使': 's', '始': 's', '士': 's', '世': 's',
  '市': 's', '示': 's', '式': 's', '事': 's', '试': 's', '视': 's', '是': 's',
  '适': 's', '室': 's', '说': 's', '思': 's', '斯': 's', '司': 's', '丝': 's',
  '私': 's', '死': 's', '四': 's', '寺': 's', '似': 's', '送': 's', '颂': 's',
  '宋': 's', '苏': 's', '速': 's', '宿': 's', '塑': 's', '酸': 's', '蒜': 's',
  '算': 's', '虽': 's', '随': 's', '岁': 's', '孙': 's', '损': 's', '缩': 's',
  '所': 's', '锁': 's', '索': 's', '他': 't', '它': 't', '她': 't', '踏': 't',
  '胎': 't', '抬': 't', '太': 't', '态': 't', '泰': 't', '坛': 't', '谈': 't',
  '坦': 't', '毯': 't', '碳': 't', '探': 't', '汤': 't', '堂': 't', '塘': 't',
  '糖': 't', '躺': 't', '趟': 't', '桃': 't', '逃': 't', '陶': 't', '套': 't',
  '特': 't', '腾': 't', '疼': 't', '痛': 't', '梯': 't', '踢': 't', '提': 't',
  '题': 't', '体': 't', '替': 't', '天': 't', '添': 't', '田': 't', '甜': 't',
  '填': 't', '挑': 't', '条': 't', '跳': 't', '贴': 't', '铁': 't', '厅': 't',
  '听': 't', '亭': 't', '庭': 't', '停': 't', '挺': 't', '通': 't', '同': 't',
  '铜': 't', '童': 't', '统': 't', '头': 't', '投': 't', '透': 't',
  '突': 't', '图': 't', '徒': 't', '涂': 't', '途': 't', '屠': 't', '土': 't',
  '吐': 't', '兔': 't', '团': 't', '推': 't', '腿': 't', '退': 't', '吞': 't',
  '托': 't', '挖': 'w', '哇': 'w', '娃': 'w', '瓦': 'w', '歪': 'w', '外': 'w',
  '弯': 'w', '湾': 'w', '完': 'w', '玩': 'w', '晚': 'w', '万': 'w', '王': 'w',
  '网': 'w', '往': 'w', '忘': 'w', '望': 'w', '危': 'w', '微': 'w', '威': 'w',
  '巍': 'w', '为': 'w', '围': 'w', '维': 'w', '伟': 'w', '伪': 'w',
  '尾': 'w', '未': 'w', '味': 'w', '位': 'w', '喂': 'w', '温': 'w', '文': 'w',
  '闻': 'w', '纹': 'w', '问': 'w', '嗡': 'w', '我': 'w', '握': 'w', '沃': 'w',
  '乌': 'w', '污': 'w', '屋': 'w', '无': 'w', '吴': 'w', '五': 'w', '午': 'w',
  '舞': 'w', '勿': 'w', '务': 'w', '物': 'w', '误': 'w', '吸': 'x', '希': 'x',
  '西': 'x', '息': 'x', '悉': 'x', '惜': 'x', '稀': 'x', '锡': 'x', '熄': 'x',
  '熙': 'x', '习': 'x', '席': 'x', '袭': 'x', '洗': 'x', '喜': 'x', '系': 'x',
  '戏': 'x', '细': 'x', '虾': 'x', '瞎': 'x', '下': 'x', '夏': 'x', '先': 'x',
  '仙': 'x', '纤': 'x', '鲜': 'x', '咸': 'x', '贤': 'x', '衔': 'x', '嫌': 'x',
  '显': 'x', '险': 'x', '现': 'x', '线': 'x', '限': 'x', '相': 'x', '香': 'x',
  '箱': 'x', '乡': 'x', '详': 'x', '想': 'x', '向': 'x', '项': 'x', '象': 'x',
  '像': 'x', '削': 'x', '消': 'x', '硝': 'x', '销': 'x', '小': 'x', '晓': 'x',
  '孝': 'x', '校': 'x', '笑': 'x', '效': 'x', '些': 'x', '歇': 'x', '协': 'x',
  '胁': 'x', '斜': 'x', '写': 'x', '泄': 'x', '泻': 'x', '谢': 'x', '心': 'x',
  '欣': 'x', '新': 'x', '信': 'x', '兴': 'x', '星': 'x', '腥': 'x', '形': 'x',
  '行': 'x', '型': 'x', '醒': 'x', '姓': 'x', '幸': 'x', '性': 'x', '凶': 'x',
  '兄': 'x', '胸': 'x', '雄': 'x', '休': 'x', '修': 'x', '虚': 'x', '需': 'x',
  '许': 'x', '序': 'x', '畜': 'x', '续': 'x', '絮': 'x', '宣': 'x', '玄': 'x',
  '选': 'x', '旋': 'x', '悬': 'x', '血': 'x', '寻': 'x', '训': 'x', '讯': 'x',
  '迅': 'x', '压': 'y', '鸦': 'y', '鸭': 'y', '牙': 'y', '芽': 'y', '崖': 'y',
  '亚': 'y', '烟': 'y', '淹': 'y', '盐': 'y', '严': 'y', '言': 'y', '研': 'y',
  '颜': 'y', '眼': 'y', '演': 'y', '厌': 'y', '药': 'y', '要': 'y', '耀': 'y',
  '爷': 'y', '也': 'y', '业': 'y', '叶': 'y', '页': 'y', '夜': 'y', '一': 'y',
  '医': 'y', '依': 'y', '仪': 'y', '宜': 'y', '姨': 'y', '移': 'y', '遗': 'y',
  '疑': 'y', '乙': 'y', '已': 'y', '以': 'y', '蚁': 'y', '椅': 'y', '义': 'y',
  '艺': 'y', '忆': 'y', '议': 'y', '异': 'y', '亦': 'y', '因': 'y', '音': 'y', '阴': 'y',
  '姻': 'y', '银': 'y', '引': 'y', '饮': 'y', '隐': 'y', '印': 'y', '应': 'y',
  '英': 'y', '婴': 'y', '鹰': 'y', '迎': 'y', '营': 'y', '蝇': 'y', '赢': 'y',
  '影': 'y', '映': 'y', '硬': 'y', '优': 'y', '幽': 'y', '尤': 'y', '由': 'y',
  '油': 'y', '游': 'y', '友': 'y', '有': 'y', '又': 'y', '右': 'y', '幼': 'y',
  '于': 'y', '予': 'y', '余': 'y', '鱼': 'y', '娱': 'y', '渔': 'y', '愉': 'y',
  '与': 'y', '宇': 'y', '语': 'y', '雨': 'y', '羽': 'y', '玉': 'y', '域': 'y',
  '育': 'y', '郁': 'y', '狱': 'y', '浴': 'y', '预': 'y', '遇': 'y', '誉': 'y',
  '渊': 'y', '元': 'y', '园': 'y', '原': 'y', '圆': 'y', '员': 'y', '缘': 'y',
  '源': 'y', '远': 'y', '愿': 'y', '院': 'y', '约': 'y', '月': 'y',
  '跃': 'y', '越': 'y', '云': 'y', '匀': 'y', '允': 'y', '运': 'y', '孕': 'y',
  '酝': 'y', '晕': 'y', '韵': 'y', '杂': 'z', '灾': 'z', '栽': 'z', '再': 'z',
  '在': 'z', '咱': 'z', '暂': 'z', '赞': 'z', '脏': 'z', '葬': 'z', '遭': 'z',
  '糟': 'z', '早': 'z', '枣': 'z', '灶': 'z', '造': 'z', '噪': 'z', '燥': 'z',
  '皂': 'z', '责': 'z', '择': 'z', '则': 'z', '怎': 'z', '增': 'z', '赠': 'z',
  '扎': 'z', '渣': 'z', '眨': 'z', '炸': 'z', '摘': 'z', '宅': 'z', '窄': 'z',
  '债': 'z', '沾': 'z', '盏': 'z', '斩': 'z', '展': 'z', '占': 'z', '战': 'z',
  '站': 'z', '张': 'z', '章': 'z', '涨': 'z', '掌': 'z', '丈': 'z', '仗': 'z',
  '帐': 'z', '胀': 'z', '障': 'z', '招': 'z', '找': 'z', '召': 'z', '照': 'z',
  '遮': 'z', '哲': 'z', '这': 'z', '浙': 'z', '蔗': 'z', '针': 'z', '珍': 'z',
  '真': 'z', '诊': 'z', '镇': 'z', '阵': 'z', '振': 'z', '争': 'z', '征': 'z',
  '整': 'z', '正': 'z', '证': 'z', '政': 'z', '之': 'z', '支': 'z', '汁': 'z',
  '芝': 'z', '知': 'z', '织': 'z', '脂': 'z', '止': 'z', '只': 'z', '指': 'z',
  '至': 'z', '志': 'z', '制': 'z', '治': 'z', '质': 'z', '致': 'z', '智': 'z',
  '中': 'z', '终': 'z', '钟': 'z', '种': 'z', '肿': 'z', '周': 'z',
  '洲': 'z', '粥': 'z', '皱': 'z', '骤': 'z', '朱': 'z', '珠': 'z', '株': 'z',
  '诸': 'z', '猪': 'z', '竹': 'z', '逐': 'z', '主': 'z', '煮': 'z', '嘱': 'z',
  '助': 'z', '住': 'z', '注': 'z', '祝': 'z', '筑': 'z', '抓': 'z', '专': 'z',
  '转': 'z', '装': 'z', '庄': 'z', '壮': 'z', '状': 'z', '追': 'z', '准': 'z',
  '捉': 'z', '桌': 'z', '着': 'z', '仔': 'z', '兹': 'z', '资': 'z', '滋': 'z',
  '子': 'z', '紫': 'z', '字': 'z', '自': 'z', '宗': 'z', '总': 'z', '纵': 'z',
  '走': 'z', '奏': 'z', '租': 'z', '足': 'z', '族': 'z', '阻': 'z', '组': 'z',
  '祖': 'z', '钻': 'z', '嘴': 'z', '最': 'z', '罪': 'z', '醉': 'z', '尊': 'z',
  '昨': 'z', '左': 'z', '作': 'z', '坐': 'z', '座': 'z', '做': 'z', '躁': 'z',
  // 补充：常用药品用字
  '钴': 'g', '胺': 'a', '肼': 'j', '噻': 's', '吩': 'f', '唑': 'z', '汀': 't',
  '洛': 'l', '贝': 'b', '纳': 'n', '沙': 's', '韦': 'w', '奈': 'n',
  '酯': 'z', '醇': 'c', '苷': 'g', '铋': 'b', '羟': 'q', '苄': 'b',
  '昔': 'x', '伦': 'l', '肽': 't', '硝': 'x', '缓': 'h', '释': 's', '溶': 'r'
}

// 获取中文的拼音首字母
function getPinyinFirst(str: string): string {
  if (!str) return ''
  let result = ''
  for (const char of str) {
    // 如果是英文字母，直接取首字母
    if (/[a-zA-Z]/.test(char)) {
      result += char.toLowerCase()
    } else if (PINYIN_MAP[char]) {
      // 如果在映射表中，直接取对应的拼音
      result += PINYIN_MAP[char]
    }
    // 未知字符静默跳过
  }
  return result
}

// 检查是否匹配拼音首字母（keyword 已经是小写）
function matchesPinyin(text: string, keyword: string): boolean {
  if (!text || !keyword) return false
  const pinyin = getPinyinFirst(text)
  return pinyin.includes(keyword)
}

// 验证常量和函数
const VALID_CATEGORIES = ['降压药', '降糖药', '降脂药', '心血管药', '胃药', '止咳药', '止痛药', '维生素', '钙片', '抗生素', '其他']
const VALID_FORMS = ['tablet', 'capsule', 'liquid']

function validateRow(row: any): string[] {
  const errors: string[] = []

  // 药品名称：必填，1-100 字
  if (!row['药品名称'] || String(row['药品名称']).trim() === '') {
    errors.push('药品名称不能为空')
  } else if (String(row['药品名称']).length > 100) {
    errors.push('药品名称过长（最多 100 字）')
  }

  // 药品分类：必填，预设分类
  if (!row['药品分类'] || String(row['药品分类']).trim() === '') {
    errors.push('药品分类不能为空')
  } else if (!VALID_CATEGORIES.includes(String(row['药品分类']))) {
    errors.push(`分类无效，可选：${VALID_CATEGORIES.join('、')}`)
  }

  // 剂型：必填，预设剂型
  if (!row['剂型'] || String(row['剂型']).trim() === '') {
    errors.push('剂型不能为空')
  } else if (!VALID_FORMS.includes(String(row['剂型']))) {
    errors.push('剂型无效（tablet/capsule/liquid）')
  }

  // 可选字段长度验证
  if (row['通用名称'] && String(row['通用名称']).length > 100) {
    errors.push('通用名称过长（最多 100 字）')
  }
  if (row['生产厂家'] && String(row['生产厂家']).length > 200) {
    errors.push('生产厂家过长（最多 200 字）')
  }
  if (row['规格'] && String(row['规格']).length > 50) {
    errors.push('规格过长（最多 50 字）')
  }
  if (row['外观描述'] && String(row['外观描述']).length > 500) {
    errors.push('外观描述过长（最多 500 字）')
  }
  if (row['剂量单位'] && String(row['剂量单位']).length > 20) {
    errors.push('剂量单位过长（最多 20 字）')
  }

  return errors
}

interface CommonMedication {
  id: string
  name: string
  generic_name?: string
  category: string
  manufacturer?: string
  specification?: string
  form?: string
  appearance_desc?: string
  dosage_unit?: string
  color?: string  // 新增颜色字段
  pinyin_initials?: string  // 拼音首字母（数据库触发器自动生成）
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  created_by_email?: string
}

const commonMedications = ref<CommonMedication[]>([])
const commonLoading = ref(true)

// 搜索和筛选
const searchKeyword = ref('')
const categoryFilter = ref('')
const categories = ref<string[]>([])
const sourceFilter = ref('') // 新增：药品来源筛选（''=全部，'admin'=管理员导入，'user'=用户添加）

// 对话框
const dialogVisible = ref(false)
const editMode = ref(false)
const currentMedication = ref<Partial<CommonMedication>>({})

// 表单引用
const formRef = ref()

// 上传相关状态
const uploadRef = ref()
const previewData = ref<any[]>([])
const previewVisible = ref(false)
const hasErrors = ref(false)

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入药品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择药品分类', trigger: 'change' }]
}

// =====================================================
// 公共药品库操作
// =====================================================

// 下载 Excel 模板
function downloadTemplate() {
  const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // 使用 XLSX 库创建 Excel 模板
  const wb = XLSX.utils.book_new()

  // 工作表 1：填写说明
  const instructionData = [
    ['📋 药品批量导入模板 - 填写说明'],
    [],
    ['填写规则：'],
    ['  • 标红单元格为必填项'],
    ['  • 药品分类：从下方选择（降压药、降糖药、降脂药、心血管药、胃药、止咳药、止痛药、维生素、钙片、抗生素、其他）'],
    ['  • 剂型：从下方选择（tablet=药片、capsule=胶囊、liquid=口服液）'],
    ['  • 重复药品判断：以"药品名称"为准，名称相同视为重复'],
    [],
    ['📝 填写示例：'],
    ['药品名称', '通用名称', '药品分类', '生产厂家', '规格', '剂型', '外观描述', '剂量单位'],
    ['阿司匹林肠溶片', '阿司匹林', '心血管药', '拜耳医药', '100mg×30 片', 'tablet', '白色圆形小药片，直径约 8mm，刻有"100"', '片'],
    ['布洛芬缓释胶囊', '布洛芬', '止痛药', '中美天津史克', '0.3g×20 粒', 'capsule', '透明胶囊，内含白色粉末', '粒']
  ]
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionData)
  wsInstructions['!cols'] = [{ wch: 60 }]
  XLSX.utils.book_append_sheet(wb, wsInstructions, '填写说明')

  // 工作表 2：模板数据
  const headers = ['药品名称', '通用名称', '药品分类', '生产厂家', '规格', '剂型', '外观描述', '剂量单位']
  const emptyRows = Array(10).fill(null).map(() => Array(8).fill(''))
  const wsTemplate = XLSX.utils.aoa_to_sheet([headers, ...emptyRows])

  // 设置列宽
  wsTemplate['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
    { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 10 }
  ]

  // 设置必填单元格背景色（浅红色）- A 列、C 列（药品分类）、F 列（剂型）
  for (let i = 2; i <= 11; i++) {
    wsTemplate[`A${i}`] = { s: { fill: { fgColor: { rgb: 'FFE6E6' } } } }
    wsTemplate[`C${i}`] = { s: { fill: { fgColor: { rgb: 'FFE6E6' } } } }
    wsTemplate[`F${i}`] = { s: { fill: { fgColor: { rgb: 'FFE6E6' } } } }
  }

  XLSX.utils.book_append_sheet(wb, wsTemplate, '模板数据')
  XLSX.writeFile(wb, `药品批量导入模板_${dateString}.xlsx`)
}

// 触发文件上传
function triggerUpload() {
  uploadRef.value?.$el.click()
}

// 处理文件上传和解析
async function handleFileUpload(file: any) {
  try {
    const fileData = await file.raw.arrayBuffer()
    const workbook = XLSX.read(fileData, { type: 'array' })

    // 获取模板数据工作表
    const ws = workbook.Sheets[workbook.SheetNames[1]]
    if (!ws) {
      ElMessage.error('无效的模板文件格式')
      return
    }

    // 解析为 JSON
    const rows = XLSX.utils.sheet_to_json(ws)

    if (rows.length === 0) {
      ElMessage.warning('模板中没有数据')
      return
    }

    // 验证每一行
    const validatedRows = rows.map((row, index) => {
      const errors = validateRow(row)
      return {
        id: index,
        data: row,
        errors,
        hasErrors: errors.length > 0
      }
    })

    previewData.value = validatedRows
    hasErrors.value = validatedRows.some(r => r.hasErrors)
    previewVisible.value = true

    const errorCount = validatedRows.filter(r => r.hasErrors).length
    if (errorCount > 0) {
      ElMessage.warning(`共 ${rows.length} 条数据，其中 ${errorCount} 条有错误，请在预览窗口中修正`)
    } else {
      ElMessage.success(`共 ${rows.length} 条数据，验证通过`)
    }
  } catch (error) {
    console.error('解析文件失败:', error)
    ElMessage.error('解析文件失败：' + (error as any).message)
  }
}

// 更新行数据
function updateRowData(rowId: number, field: string, value: any) {
  const row = previewData.value.find(r => r.id === rowId)
  if (row) {
    row.data[field] = value
    // 重新验证
    row.errors = validateRow(row.data)
    row.hasErrors = row.errors.length > 0
    hasErrors.value = previewData.value.some(r => r.hasErrors)
  }
}

// 删除行
function deleteRow(rowId: number) {
  previewData.value = previewData.value.filter(r => r.id !== rowId)
  hasErrors.value = previewData.value.some(r => r.hasErrors)
}

// 批量导入数据
async function handleBatchImport() {
  if (hasErrors.value) {
    ElMessage.warning('还有错误数据未修正，无法导入')
    return
  }

  const validRows = previewData.value.filter(r => !r.hasErrors)
  if (validRows.length === 0) {
    ElMessage.warning('没有可导入的数据')
    return
  }

  try {
    const loading = ElLoading.service({
      lock: true,
      text: '正在导入药品...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    const results = {
      success: 0,
      duplicate: 0,
      failed: 0,
      details: [] as { name: string; reason: string; type: 'duplicate' | 'failed' }[]
    }

    for (const row of validRows) {
      const medData = {
        name: row.data['药品名称'],
        generic_name: row.data['通用名称'] || '',
        category: row.data['药品分类'],
        manufacturer: row.data['生产厂家'] || '',
        specification: row.data['规格'] || '',
        form: row.data['剂型'],
        appearance_desc: row.data['外观描述'] || '',
        dosage_unit: row.data['剂量单位'] || '',
        is_active: true
      }

      const { error } = await supabase
        .from('common_medications')
        .insert([medData])

      if (error) {
        if (error.code === '23505') {
          results.duplicate++
          results.details.push({ name: medData.name, reason: '药品已存在', type: 'duplicate' })
        } else {
          results.failed++
          results.details.push({ name: medData.name, reason: error.message, type: 'failed' })
        }
      } else {
        results.success++
      }
    }

    loading.close()
    previewVisible.value = false
    showImportResult(results)
    await fetchCommonMedications()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败：' + (error as any).message)
  }
}

// 显示导入结果
function showImportResult(results: any) {
  let message = `<div style="text-align: left; padding: 10px 0;">`
  message += `<p style="color: #67c23a; margin: 5px 0;">✓ 成功导入：${results.success} 条</p>`
  if (results.duplicate > 0) {
    message += `<p style="color: #e6a23c; margin: 5px 0;">⚠ 跳过重复：${results.duplicate} 条</p>`
    results.details.filter((d: any) => d.type === 'duplicate').forEach((d: any) => {
      message += `<p style="color: #e6a23c; margin: 2px 0; padding-left: 20px;">• ${d.name}（${d.reason}）</p>`
    })
  }
  if (results.failed > 0) {
    message += `<p style="color: #f56c6c; margin: 5px 0;">✗ 导入失败：${results.failed} 条</p>`
    results.details.filter((d: any) => d.type === 'failed').forEach((d: any) => {
      message += `<p style="color: #f56c6c; margin: 2px 0; padding-left: 20px;">• ${d.name}（${d.reason}）</p>`
    })
  }
  message += `</div>`
  ElMessageBox.alert(message, '导入完成', { dangerouslyUseHTMLString: true, confirmButtonText: '确定' })
}

async function fetchCommonMedications() {
  commonLoading.value = true

  try {
    // 使用视图查询获取药品数据（视图已包含添加者邮箱）
    let query = supabase
      .from('admin_medication_sources')
      .select('*')
      .order('created_at_with_tz', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    let medications = (data || []).map(item => ({
      ...item,
      created_at: item.created_at_with_tz,
      created_by_email: item.added_by_email
    }))

    // 搜索筛选 - 在客户端进行，支持拼音首字母
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      medications = medications.filter(med => {
        // 药品名称匹配（包含匹配）
        const nameMatch = med.name?.toLowerCase().includes(keyword)
        // 通用名称匹配
        const genericMatch = med.generic_name?.toLowerCase().includes(keyword)
        // 拼音首字母匹配
        const pinyinMatch = matchesPinyin(med.name, keyword)

        return nameMatch || genericMatch || pinyinMatch
      })
    }

    // 分类筛选
    if (categoryFilter.value) {
      medications = medications.filter(med => med.category === categoryFilter.value)
    }

    // 来源筛选
    if (sourceFilter.value === 'admin') {
      // 管理员导入：created_by 为 NULL
      medications = medications.filter(med => !med.created_by)
    } else if (sourceFilter.value === 'user') {
      // 用户添加：created_by 不为 NULL
      medications = medications.filter(med => !!med.created_by)
    }

    commonMedications.value = medications

    // 提取所有分类
    const uniqueCategories = new Set(commonMedications.value.map(m => m.category).filter(Boolean))
    categories.value = Array.from(uniqueCategories)
  } catch (error) {
    console.error('获取公共药品列表失败:', error)
  } finally {
    commonLoading.value = false
  }
}

function handleAdd() {
  editMode.value = false
  currentMedication.value = {
    is_active: true
  }
  dialogVisible.value = true
}

function handleEdit(medication: CommonMedication) {
  editMode.value = true
  currentMedication.value = { ...medication }
  dialogVisible.value = true
}

async function handleDelete(medication: CommonMedication) {
  if (!confirm(`确定要删除药品"${medication.name}"吗？`)) return

  try {
    const { error } = await supabase
      .from('common_medications')
      .delete()
      .eq('id', medication.id)

    if (error) throw error

    ElMessage.success('药品已删除')
    await fetchCommonMedications()
  } catch (error) {
    console.error('删除药品失败:', error)
    ElMessage.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()

    if (editMode.value && currentMedication.value.id) {
      // 更新药品
      const { error } = await supabase
        .from('common_medications')
        .update({
          name: currentMedication.value.name,
          generic_name: currentMedication.value.generic_name,
          category: currentMedication.value.category,
          manufacturer: currentMedication.value.manufacturer,
          specification: currentMedication.value.specification,
          form: currentMedication.value.form,
          color: currentMedication.value.color,
          appearance_desc: currentMedication.value.appearance_desc,
          dosage_unit: currentMedication.value.dosage_unit,
          is_active: currentMedication.value.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMedication.value.id)

      if (error) throw error
      ElMessage.success('药品已更新')
    } else {
      // 添加新药品
      const { error } = await supabase
        .from('common_medications')
        .insert([{
          name: currentMedication.value.name,
          generic_name: currentMedication.value.generic_name,
          category: currentMedication.value.category,
          manufacturer: currentMedication.value.manufacturer,
          specification: currentMedication.value.specification,
          form: currentMedication.value.form,
          color: currentMedication.value.color,
          appearance_desc: currentMedication.value.appearance_desc,
          dosage_unit: currentMedication.value.dosage_unit,
          is_active: currentMedication.value.is_active ?? true
        }])

      if (error) throw error
      ElMessage.success('药品已添加')
    }

    dialogVisible.value = false
    await fetchCommonMedications()
  } catch (error) {
    console.error('保存药品失败:', error)
  }
}

function handleClearFilter() {
  searchKeyword.value = ''
  categoryFilter.value = ''
  sourceFilter.value = ''
  fetchCommonMedications()
}

onMounted(() => {
  fetchCommonMedications()
})
</script>

<template>
  <div class="medications-page">
    <div class="page-header">
      <h2>公共药品库管理</h2>
      <div style="display: flex; gap: 12px">
        <el-button @click="downloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-button @click="triggerUpload">
          <el-icon><Upload /></el-icon>
          上传
        </el-button>
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileUpload"
          :show-file-list="false"
          accept=".xlsx,.xls"
          style="display: none"
        >
          <el-button>上传</el-button>
        </el-upload>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加药品
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索药品名称或通用名（支持拼音首字母）"
          style="width: 300px"
          clearable
          @clear="fetchCommonMedications"
          @input="fetchCommonMedications"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="fetchCommonMedications">搜索</el-button>
          </template>
        </el-input>

        <el-select
          v-model="categoryFilter"
          placeholder="全部分类"
          style="width: 200px"
          clearable
          @change="fetchCommonMedications"
        >
          <el-option label="全部分类" value="" />
          <el-option
            v-for="cat in categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>

        <el-select
          v-model="sourceFilter"
          placeholder="药品来源"
          style="width: 150px"
          clearable
          @change="fetchCommonMedications"
        >
          <el-option label="全部来源" value="" />
          <el-option label="管理员导入" value="admin" />
          <el-option label="用户添加" value="user" />
        </el-select>

        <el-button @click="handleClearFilter" style="margin-left: 12px">重置</el-button>
      </div>
    </el-card>

    <!-- 药品列表 -->
    <el-card>
      <el-table
        :data="commonMedications"
        v-loading="commonLoading"
        style="width: 100%"
      >
        <el-table-column prop="name" label="药品名称" />
        <el-table-column prop="generic_name" label="通用名称" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="manufacturer" label="生产厂家" />
        <el-table-column prop="specification" label="规格" width="120" />
        <el-table-column prop="form" label="剂型" width="100" />
        <el-table-column prop="is_active" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '在用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by" label="添加者" width="150">
          <template #default="{ row }">
            <el-tag :type="row.created_by ? 'primary' : 'success'" size="small">
              {{ row.created_by ? '用户添加' : '管理员导入' }}
            </el-tag>
            <text v-if="row.created_by_email" class="adder-email">{{ row.created_by_email }}</text>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="添加时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editMode ? '编辑药品' : '添加药品'"
      width="700px"
      @closed="formRef?.resetFields()"
    >
      <el-form
        ref="formRef"
        :model="currentMedication"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品名称" prop="name">
              <el-input v-model="currentMedication.name" placeholder="如：阿司匹林肠溶片" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通用名称">
              <el-input v-model="currentMedication.generic_name" placeholder="如：Acetylsalicylic Acid" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品分类" prop="category">
              <el-select v-model="currentMedication.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="降压药" value="降压药" />
                <el-option label="降糖药" value="降糖药" />
                <el-option label="降脂药" value="降脂药" />
                <el-option label="心血管药" value="心血管药" />
                <el-option label="胃药" value="胃药" />
                <el-option label="止咳药" value="止咳药" />
                <el-option label="止痛药" value="止痛药" />
                <el-option label="维生素" value="维生素" />
                <el-option label="钙片" value="钙片" />
                <el-option label="抗生素" value="抗生素" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产厂家">
              <el-input v-model="currentMedication.manufacturer" placeholder="如：拜耳医药" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="currentMedication.specification" placeholder="如：100mg*30 片" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="剂型">
              <el-select v-model="currentMedication.form" placeholder="请选择剂型" style="width: 100%">
                <el-option label="药片" value="tablet" />
                <el-option label="胶囊" value="capsule" />
                <el-option label="口服液" value="liquid" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="颜色" v-if="['tablet', 'capsule'].includes(currentMedication.form)">
              <el-color-picker v-model="currentMedication.color" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="剂量单位">
              <el-input v-model="currentMedication.dosage_unit" placeholder="如：片、粒、ml" style="width: 120px" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="状态">
              <el-switch v-model="currentMedication.is_active" active-text="在用" inactive-text="停用" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="外观描述">
          <el-input
            v-model="currentMedication.appearance_desc"
            type="textarea"
            :rows="2"
            placeholder="如：黄色椭圆形薄膜衣片"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 上传预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="`批量导入预览 - 共 ${previewData.length} 条，错误 ${previewData.filter(r => r.hasErrors).length} 条`"
      width="1200px"
      :close-on-click-modal="false"
    >
      <el-table :data="previewData" max-height="500">
        <el-table-column label="药品名称" width="180">
          <template #default="{ row }">
            <el-input v-model="row.data['药品名称']" @change="updateRowData(row.id, '药品名称', ($event.target as HTMLInputElement).value)" />
          </template>
        </el-table-column>
        <el-table-column label="通用名称" width="150">
          <template #default="{ row }">
            <el-input v-model="row.data['通用名称']" @change="updateRowData(row.id, '通用名称', ($event.target as HTMLInputElement).value)" />
          </template>
        </el-table-column>
        <el-table-column label="药品分类" width="150">
          <template #default="{ row }">
            <el-select v-model="row.data['药品分类']" @change="updateRowData(row.id, '药品分类', $event)">
              <el-option v-for="cat in VALID_CATEGORIES" :key="cat" :label="cat" :value="cat" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="生产厂家" width="180">
          <template #default="{ row }">
            <el-input v-model="row.data['生产厂家']" @change="updateRowData(row.id, '生产厂家', ($event.target as HTMLInputElement).value)" />
          </template>
        </el-table-column>
        <el-table-column label="规格" width="120">
          <template #default="{ row }">
            <el-input v-model="row.data['规格']" @change="updateRowData(row.id, '规格', ($event.target as HTMLInputElement).value)" />
          </template>
        </el-table-column>
        <el-table-column label="剂型" width="120">
          <template #default="{ row }">
            <el-select v-model="row.data['剂型']" @change="updateRowData(row.id, '剂型', $event)">
              <el-option v-for="form in VALID_FORMS" :key="form" :label="form" :value="form" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="外观描述" width="200">
          <template #default="{ row }">
            <el-input v-model="row.data['外观描述']" @change="updateRowData(row.id, '外观描述', ($event.target as HTMLInputElement).value)" />
          </template>
        </el-table-column>
        <el-table-column label="剂量单位" width="100">
          <template #default="{ row }">
            <el-input v-model="row.data['剂量单位']" @change="updateRowData(row.id, '剂量单位', ($event.target as HTMLInputElement).value)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" fixed="right">
          <template #default="{ row }">
            <el-tag :type="row.hasErrors ? 'danger' : 'success'" size="small">
              {{ row.hasErrors ? '有错误' : '通过' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="deleteRow(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <el-alert
            v-if="hasErrors"
            type="warning"
            title="还有错误数据，请修正或删除错误行后方可导入"
            :closable="false"
            show-icon
            style="flex: 1; margin-right: 16px;"
          />
          <el-alert
            v-else
            type="success"
            title="所有数据验证通过，可以导入"
            :closable="false"
            show-icon
            style="flex: 1; margin-right: 16px;"
          />
          <div>
            <el-button @click="previewVisible = false">取消</el-button>
            <el-button
              type="primary"
              @click="handleBatchImport"
              :disabled="hasErrors || previewData.length === 0"
            >
              开始导入 ({{ previewData.length }} 条)
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.medications-page {
  width: 100%;
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 700;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.adder-email {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}
</style>
