/**
 * 农历日历工具
 * 提供公历转农历、黄历宜忌、节假日等功能
 */

const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0,
  0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570,
  0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3,
  0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0,
  0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0,
  0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263,
  0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558,
  0x0b540, 0x0b5a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40,
  0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0,
  0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7,
  0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0,
  0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0,
  0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6,
  0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50,
  0x1b255, 0x06d20, 0x0ada0
];

const Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const Animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const huangliData = {
  suitable: {
    0: ['祭祀', '祈福', '求嗣', '开光', '出行', '嫁娶', '订盟', '纳采', '裁衣', '安床', '修造', '动土', '移徙', '入宅', '开市', '交易', '立券', '纳财', '安葬'],
    1: ['祭祀', '祈福', '求嗣', '开光', '出行', '嫁娶', '订盟', '纳采', '裁衣', '安床', '修造', '动土', '移徙', '入宅', '开市', '交易', '立券', '纳财', '安葬'],
    2: ['祭祀', '祈福', '求嗣', '开光', '出行', '嫁娶', '订盟', '纳采', '裁衣', '安床', '修造', '动土', '移徙', '入宅', '开市', '交易', '立券', '纳财', '安葬'],
    3: ['祭祀', '祈福', '求嗣', '开光', '出行', '嫁娶', '订盟', '纳采', '裁衣', '安床', '修造', '动土', '移徙', '入宅', '开市', '交易', '立券', '纳财', '安葬'],
    4: ['祭祀', '祈福', '求嗣', '开光', '出行', '嫁娶', '订盟', '纳采', '裁衣', '安床', '修造', '动土', '移徙', '入宅', '开市', '交易', '立券', '纳财', '安葬'],
    5: ['祭祀', '祈福', '求嗣', '开光', '出行', '嫁娶', '订盟', '纳采', '裁衣', '安床', '修造', '动土', '移徙', '入宅', '开市', '交易', '立券', '纳财', '安葬'],
    6: ['祭祀', '祈福', '求嗣', '开光', '出行', '嫁娶', '订盟', '纳采', '裁衣', '安床', '修造', '动土', '移徙', '入宅', '开市', '交易', '立券', '纳财', '安葬']
  },
  avoid: {
    0: ['破土', '开市', '交易', '动土', '嫁娶', '移徙', '入宅'],
    1: ['破土', '开市', '交易', '动土', '嫁娶', '移徙', '入宅'],
    2: ['破土', '开市', '交易', '动土', '嫁娶', '移徙', '入宅'],
    3: ['破土', '开市', '交易', '动土', '嫁娶', '移徙', '入宅'],
    4: ['破土', '开市', '交易', '动土', '嫁娶', '移徙', '入宅'],
    5: ['破土', '开市', '交易', '动土', '嫁娶', '移徙', '入宅'],
    6: ['破土', '开市', '交易', '动土', '嫁娶', '移徙', '入宅']
  }
};

const holidays = {
  '01-01': { name: '元旦', type: 'statutory' },
  '02-14': { name: '情人节', type: 'festival' },
  '03-08': { name: '妇女节', type: 'festival' },
  '03-12': { name: '植树节', type: 'festival' },
  '05-01': { name: '劳动节', type: 'statutory' },
  '05-04': { name: '青年节', type: 'festival' },
  '06-01': { name: '儿童节', type: 'festival' },
  '07-01': { name: '建党节', type: 'festival' },
  '08-01': { name: '建军节', type: 'festival' },
  '09-10': { name: '教师节', type: 'festival' },
  '10-01': { name: '国庆节', type: 'statutory' },
  '12-25': { name: '圣诞节', type: 'festival' }
};

const lunarHolidays = {
  '01-01': { name: '春节', type: 'traditional' },
  '01-02': { name: '春节', type: 'traditional' },
  '01-03': { name: '春节', type: 'traditional' },
  '01-15': { name: '元宵节', type: 'traditional' },
  '02-02': { name: '龙抬头', type: 'traditional' },
  '05-05': { name: '端午节', type: 'traditional' },
  '07-07': { name: '七夕节', type: 'traditional' },
  '07-15': { name: '中元节', type: 'traditional' },
  '08-15': { name: '中秋节', type: 'traditional' },
  '09-09': { name: '重阳节', type: 'traditional' },
  '10-01': { name: '寒衣节', type: 'traditional' },
  '12-08': { name: '腊八节', type: 'traditional' },
  '12-23': { name: '小年', type: 'traditional' },
  '12-30': { name: '除夕', type: 'traditional' }
};

class LunarCalendar {
  constructor () {
    this.baseDate = new Date(1900, 0, 31);
    this.baseMonth = 11;
    this._cache = new Map();
  }

  /**
   * 公历转农历
   * @param {Date} date - 公历日期
   * @returns {Object} 农历日期信息
   */
  solarToLunar (date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let i; let leap = 0; let temp = 0;

    if ((year < 1900) || (year > 2100)) {
      return null;
    }

    const objDate = new Date(year, month - 1, day);
    const baseDate = new Date(1900, 0, 31);
    let offset = Math.floor((objDate - baseDate) / 86400000);

    for (i = 1900; i < 2101 && offset > 0; i++) {
      temp = this.lYearDays(i);
      offset -= temp;
    }

    if (offset < 0) {
      offset += temp;
      i--;
    }

    const yearCyl = i - 1900 + 36;

    leap = this.leapMonth(i);
    let isLeap = false;

    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === (leap + 1) && isLeap === false) {
        --i;
        isLeap = true;
        temp = this.leapDays(yearCyl + 1900 - 36);
      } else {
        temp = this.monthDays(yearCyl + 1900 - 36, i);
      }

      if (isLeap === true && i === (leap + 1)) isLeap = false;
      offset -= temp;
    }

    if (offset === 0 && leap > 0 && i === leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
      }
    }

    if (offset < 0) {
      offset += temp;
      --i;
    }

    const lunarYear = yearCyl + 1900 - 36;
    const lunarMonth = i;
    const lunarDay = offset + 1;

    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap,
      yearGanZhi: this.getYearGanZhi(lunarYear),
      yearAnimal: this.getYearAnimal(lunarYear),
      monthText: (isLeap ? '闰' : '') + lunarMonths[lunarMonth - 1],
      dayText: lunarDays[lunarDay - 1]
    };
  }

  lYearDays (y) {
    let i; let sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) {
      sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return (sum + this.leapDays(y));
  }

  leapMonth (y) {
    return (lunarInfo[y - 1900] & 0xf);
  }

  leapDays (y) {
    if (this.leapMonth(y)) {
      return ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29);
    } else {
      return (0);
    }
  }

  monthDays (y, m) {
    return ((lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29);
  }

  getYearGanZhi (year) {
    return Gan[(year - 4) % 10] + Zhi[(year - 4) % 12];
  }

  getYearAnimal (year) {
    return Animals[(year - 4) % 12];
  }

  /**
   * 获取黄历宜忌
   * @param {Date} date - 日期
   * @returns {Object} 宜忌信息
   */
  getHuangli (date) {
    const weekDay = date.getDay();
    return {
      suitable: huangliData.suitable[weekDay].slice(0, 6),
      avoid: huangliData.avoid[weekDay].slice(0, 4)
    };
  }

  /**
   * 获取节假日信息
   * @param {Date} date - 日期
   * @param {Object} lunar - 农历日期
   * @returns {Array} 节假日列表
   */
  getHolidays (date, lunar) {
    const result = [];

    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (holidays[monthDay]) {
      result.push(holidays[monthDay]);
    }

    if (lunar) {
      const lunarMonthDay = `${String(lunar.month).padStart(2, '0')}-${String(lunar.day).padStart(2, '0')}`;
      if (lunarHolidays[lunarMonthDay]) {
        result.push(lunarHolidays[lunarMonthDay]);
      }
    }

    return result;
  }

  /**
   * 获取完整的日历信息
   * @param {Date} date - 日期
   * @returns {Object} 完整日历信息
   */
  getCalendarInfo (date = new Date()) {
    const cacheKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    const lunar = this.solarToLunar(date);
    const huangli = this.getHuangli(date);
    const holidays = this.getHolidays(date, lunar);

    const result = {
      solar: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekDay: date.getDay(),
        weekDayText: weekDays[date.getDay()]
      },
      lunar,
      huangli,
      holidays
    };

    this._cache.set(cacheKey, result);

    return result;
  }
}

const lunarCalendar = new LunarCalendar();

export default lunarCalendar;
