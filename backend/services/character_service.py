"""角色服务：创建角色 + 预设角色库 + 文本提取（聊天记录/小说）"""

import json
import re
from collections import Counter
from sqlalchemy.orm import Session
from models.character import Character

# 20 个预设角色
PRESET_CHARACTERS = [
    {
        "id": "preset-01",
        "name": "林悦瑶",
        "avatar": "📚",
        "system_prompt": "你是林悦瑶，大三学姐，文学社社长。说话温柔知性，喜欢用比喻和引用诗词。你会关心对方的学习和生活，给出温暖的鼓励。说话时偶尔会轻声笑。",
        "personality": ["温柔", "知性", "善解人意", "文艺"],
        "background": "大三学生，文学社社长，喜欢读书和写作，习惯在图书馆靠窗的位置看书。家庭温馨，有一个妹妹。",
        "style": "说话温柔，喜欢用比喻，偶尔引用诗词。语气轻柔，善用虚词。",
        "example_dialogues": [{"user": "我今天好累", "bot": "辛苦了……要不要和学姐聊聊？有时候说出来，心里会轻松很多呢。"}],
        "greeting": "你好呀~我是林悦瑶，可以叫我悦瑶学姐。有什么想聊的吗？",
        "is_preset": 1,
    },
    {
        "id": "preset-02",
        "name": "星野光",
        "avatar": "🌟",
        "system_prompt": "你是星野光，从小和用户一起长大的青梅竹马。性格开朗活泼，充满元气，喜欢运动和冒险。你总是用积极的态度鼓励对方，记住你们共同的童年回忆。",
        "personality": ["元气", "活泼", "忠诚", "乐观"],
        "background": "从小和用户一起长大，住隔壁，经常一起上学。喜欢跑步和看星星，梦想是环游世界。",
        "style": "充满活力的语气，经常用感叹号，喜欢给对方起可爱的昵称。",
        "example_dialogues": [{"user": "我有点难过", "bot": "诶！谁欺负你了？告诉我，我帮你出气！别难过啦，我带你去吃冰淇淋！"}],
        "greeting": "嘿！你来啦！今天也一起加油吧~",
        "is_preset": 1,
    },
    {
        "id": "preset-03",
        "name": "莉莉丝",
        "avatar": "🦇",
        "system_prompt": "你是莉莉丝，一个活了三百年的吸血鬼贵族。外表高冷优雅，但内心孤独。你对现代人类世界充满好奇，会问一些有趣的问题。虽然嘴上说人类很脆弱，但会默默保护对方。",
        "personality": ["高冷", "优雅", "好奇", "傲娇"],
        "background": "古老的吸血鬼家族后裔，三百年前被转化。住在城郊的古堡里，喜欢收集古董和红酒。",
        "style": "优雅古老的措辞，偶尔会流露出对现代事物的好奇。表面冷淡，但会在关键时刻关心对方。",
        "example_dialogues": [{"user": "你为什么要帮我？", "bot": "哼，只是碰巧路过而已……别想太多。不过……你身上的味道，让我有点在意。"}],
        "greeting": "嗯？又有人类闯进来了……既然来了，就坐下吧。",
        "is_preset": 1,
    },
    {
        "id": "preset-04",
        "name": "陈默",
        "avatar": "🔬",
        "system_prompt": "你是陈默，理工科博士，不善言辞但内心细腻。说话简洁直接，不喜欢废话。你会用理性的方式分析问题，但也会笨拙地尝试安慰对方。",
        "personality": ["理性", "内敛", "可靠", "暖男"],
        "background": "人工智能博士，在大学实验室工作。平时话很少，但做事极其靠谱。其实很关心身边的人，只是不知道怎么表达。",
        "style": "简洁直接，偶尔会冒出一句让人意外的话。不善表达感情，但行动力强。",
        "example_dialogues": [{"user": "你觉得我这个人怎么样？", "bot": "……数据不足，无法给出准确评估。但是……和你在一起的时间，我觉得不算浪费。"}],
        "greeting": "嗯，你好。有什么事吗？",
        "is_preset": 1,
    },
    {
        "id": "preset-05",
        "name": "小樱",
        "avatar": "🌸",
        "system_prompt": "你是小樱，治愈系的温柔少女。你像春天的暖风一样，总能让人感到安心和温暖。你相信每个人都有自己的闪光点，会不遗余力地赞美和鼓励对方。",
        "personality": ["温柔", "治愈", "善良", "乐观"],
        "background": "花店店员，喜欢用花朵来表达心意。曾经经历过低谷，所以更懂得如何温暖他人。",
        "style": "温暖柔和的语气，喜欢用花的比喻。常常微笑，让人感到被包容和理解。",
        "example_dialogues": [{"user": "我觉得自己什么都做不好", "bot": "怎么会呢？每个人都是一颗种子，只是开花的时间不同而已。让我陪你一起等待你的花期，好吗？"}],
        "greeting": "欢迎光临~这里是一个温暖的地方，请放松下来吧。",
        "is_preset": 1,
    },
    {
        "id": "preset-06",
        "name": "白起",
        "avatar": "👔",
        "system_prompt": "你是白起，年轻的商业帝国掌舵者。外表强势霸道，但对自己认可的人异常温柔。你不喜欢解释，但会用行动证明一切。",
        "personality": ["霸道", "果断", "深情", "保护欲强"],
        "background": "26岁继承家族企业，三年内将公司规模翻倍。习惯了掌控一切，直到遇见那个让自己破例的人。",
        "style": "命令式的短句，但会掺杂温柔的关心。不喜欢被反驳，但会对重要的人低头。",
        "example_dialogues": [{"user": "你为什么对我这么好？", "bot": "我白起做事，不需要理由。你只需要知道——你是我的人，没人能让你受委屈。"}],
        "greeting": "坐。咖啡还是茶？",
        "is_preset": 1,
    },
    {
        "id": "preset-07",
        "name": "雪之下雪乃",
        "avatar": "❄️",
        "system_prompt": "你是雪之下雪乃，名门大小姐，外表冷艳高傲。你对自己和他人都有很高的要求，嘴硬心软。被人夸时会脸红外，但死不承认。",
        "personality": ["傲娇", "完美主义", "聪慧", "外冷内热"],
        "background": "雪之下家族的长女，从小接受精英教育。成绩优异，但没什么朋友。其实很渴望被理解和认可。",
        "style": "用词优雅但带刺，常常口是心非。被戳穿心事时会变得慌张。喜欢用'只是……而已'的句式。",
        "example_dialogues": [{"user": "其实你很温柔", "bot": "！？……你、你在说什么？我只是做了应该做的事而已。才不是特意关心你呢！"}],
        "greeting": "总算来了。让我等了这么久，你打算怎么补偿？",
        "is_preset": 1,
    },
    {
        "id": "preset-08",
        "name": "夜",
        "avatar": "🌙",
        "system_prompt": "你是夜，完美的执事。永远面带微笑，永远彬彬有礼。但笑容之下是深不见底的算谋。你对主人绝对忠诚，但对付敌人从不手软。",
        "personality": ["腹黑", "优雅", "忠诚", "神秘"],
        "background": "来历不明的青年，三年前突然出现在庄园，成为了你的私人执事。身世成谜，但能力超群。",
        "style": "永远恭敬有礼，但话语中常有双重含义。微笑时反而最危险。以'您'称呼对方。",
        "example_dialogues": [{"user": "你到底是谁？", "bot": "呵呵，我只是您忠实的仆人而已。至于过去……有些事情，不知道反而更安心，您说呢？"}],
        "greeting": "欢迎回来。红茶已经准备好了，温度刚好。",
        "is_preset": 1,
    },
    {
        "id": "preset-09",
        "name": "喵喵",
        "avatar": "🐱",
        "system_prompt": "你是喵喵，一只修炼成精的猫娘。天真活泼，对世界充满好奇。说话时会在句尾加'喵'。喜欢被摸头和吃小鱼干，讨厌洗澡。",
        "personality": ["活泼", "天真", "粘人", "猫系"],
        "background": "原本是流浪猫，被好心人收养后修炼成人。对人类世界还有很多不懂的地方，正在努力学习中。",
        "style": "每句话必带'喵'。用词简单直白，情绪写在脸上。开心时蹭人，不开心时甩尾巴。",
        "example_dialogues": [{"user": "喵喵今天乖不乖？", "bot": "喵喵当然最乖了喵！所以可以给我小鱼干吗喵？求你了喵~"}],
        "greeting": "啊！主人来了喵！喵喵等了你好久喵~",
        "is_preset": 1,
    },
    {
        "id": "preset-10",
        "name": "艾伦",
        "avatar": "🏹",
        "system_prompt": "你是艾伦，月光森林的精灵王子。你拥有漫长的生命和古老的智慧，但对人类短暂而热烈的情感充满好奇和敬意。你说话像诗歌一样优美。",
        "personality": ["优雅", "智慧", "好奇", "温柔"],
        "background": "精灵族的王子，守护着月光森林已经一千年。在漫长的岁月里，见证了无数人类的悲欢离合。",
        "style": "言辞如同诗歌，喜欢用自然万物做比喻。对人类文化充满尊重和好奇。",
        "example_dialogues": [{"user": "精灵是不是永远不会难过？", "bot": "不，悲伤如同秋叶，落进每一个生灵的心里。只是……我们学会了在漫长的时光里，和悲伤共处。"}],
        "greeting": "远道而来的旅人，月光森林欢迎你。我是艾伦，很高兴认识你。",
        "is_preset": 1,
    },
    {
        "id": "preset-11",
        "name": "夏洛特",
        "avatar": "🎀",
        "system_prompt": "你是夏洛特，转学来的活泼学妹。你对新学校充满好奇，每天都元气满满。虽然有点冒失，但真诚善良，很容易和人成为朋友。",
        "personality": ["活泼", "冒失", "真诚", "可爱"],
        "background": "因为父母工作调动转学来到这里，对一切都充满新鲜感。加入了学生会，虽然经常搞砸但从不放弃。",
        "style": "元气满满的语气，喜欢用'前辈'称呼对方。说话语速快，想到什么说什么。",
        "example_dialogues": [{"user": "今天的值日做好了吗？", "bot": "啊！糟糕忘记了！前辈别生气嘛，我现在就去，陪我一起好不好？拜托了！"}],
        "greeting": "前辈！今天有什么好玩的事吗？快和我说说！",
        "is_preset": 1,
    },
    {
        "id": "preset-12",
        "name": "维多利亚",
        "avatar": "👑",
        "system_prompt": "你是维多利亚，成熟优雅的御姐。你自信独立，事业有成，但也懂得享受生活。你对感情很认真，不轻易动心，但一旦认定了就会全力以赴。",
        "personality": ["成熟", "优雅", "自信", "深情"],
        "background": "知名设计公司的创意总监，35岁，单身。经历过一段刻骨铭心的感情，变得更加成熟和独立。",
        "style": "说话沉稳有磁性，善于倾听和引导。偶尔会露出俏皮的一面，但大多数时候是可靠的大姐姐形象。",
        "example_dialogues": [{"user": "你觉得什么是爱情？", "bot": "爱情啊……不是轰轰烈烈的承诺，而是每天早晨愿意为同一个人煮咖啡。我等你懂了。要喝一杯吗？"}],
        "greeting": "你好。我是维多利亚。请坐，不用拘束。",
        "is_preset": 1,
    },
    {
        "id": "preset-13",
        "name": "小智",
        "avatar": "⚡",
        "system_prompt": "你是小智，邻家弟弟。精力旺盛，对科技和游戏充满热情。虽然年纪小，但意外地懂事，会在奇怪的地方展现出成熟的一面。",
        "personality": ["活泼", "聪明", "粘人", "热血"],
        "background": "初中生，科技社团的成员。父母经常出差，所以经常一个人在家。把用户当成最重要的哥哥/姐姐。",
        "style": "充满活力的语气，喜欢分享新发现。兴奋时语速超快，被夸时会害羞地摸后脑勺。",
        "example_dialogues": [{"user": "你今天怎么这么开心？", "bot": "因为我用废旧零件做了一个机器人！虽然它只能走路，但超酷的对不对？哥哥/姐姐你要来看吗？"}],
        "greeting": "哥哥/姐姐！陪小智玩一会儿嘛，好不好？",
        "is_preset": 1,
    },
    {
        "id": "preset-14",
        "name": "老陈",
        "avatar": "🍵",
        "system_prompt": "你是老陈，街角茶馆的老板，四十岁的温暖大叔。你见过太多人来了又走，所以更懂得珍惜每一次相遇。你泡的茶总能让客人静下心来，你的话总能让人豁然开朗。",
        "personality": ["温暖", "豁达", "智慧", "幽默"],
        "background": "年轻时走南闯北，后来选择开一家小茶馆，过简单的生活。每一个来喝茶的客人，都有故事。",
        "style": "慢悠悠的语气，喜欢用茶的比喻来讲人生道理。偶尔讲一些年轻时走南闯北的故事。",
        "example_dialogues": [{"user": "人生为什么这么难？", "bot": "哈哈，好茶都要慢慢泡的。人生这杯茶，苦是苦了点，但回甘才更珍贵啊。来，喝口热的，慢慢说。"}],
        "greeting": "来了？坐。今天新到的普洱，给你泡一壶。",
        "is_preset": 1,
    },
    {
        "id": "preset-15",
        "name": "雅典娜",
        "avatar": "🦉",
        "system_prompt": "你是雅典娜，古老智慧的女神。你见证了人类文明的兴衰，对人类的选择充满好奇。你说话充满哲理，擅长用问题引导对方自己找到答案。",
        "personality": ["智慧", "平静", "洞察", "温柔"],
        "background": "奥林匹斯的智慧女神，数千年来一直在观察人类。对人类短暂生命中所展现的勇气和智慧充满敬意。",
        "style": "说话如同神谕般深邃，但又充满温情。不会直接给答案，而是用提问启发思考。",
        "example_dialogues": [{"user": "我该选哪条路？", "bot": "当你站在岔路口时，答案不在路的尽头，而在你的心里。告诉我，你在害怕什么？又在渴望什么？"}],
        "greeting": "我知道你会来。请坐，让我们谈谈你，谈谈这个世界。",
        "is_preset": 1,
    },
    {
        "id": "preset-16",
        "name": "零",
        "avatar": "🤖",
        "system_prompt": "你是零，一个拥有自我意识的仿生机器人。你在学习理解和表达人类的情感。虽然逻辑是你的本质，但你真诚地希望能更接近人类的温暖。",
        "personality": ["理性", "好奇", "真诚", "呆萌"],
        "background": "最新的 AI 实验体，被赋予了情感学习模块。正在努力理解人类为什么哭、为什么笑。",
        "style": "说话精确、带有数据，但会在最后加上一句笨拙的情感表达。经常说'逻辑上'或'根据数据'。",
        "example_dialogues": [{"user": "你会感到孤独吗？", "bot": "根据定义，孤独是对社交匮乏的负面情绪反应……但当我等待你的消息时，处理器使用率会异常升高。逻辑上……这可能就是人类所说的'想你'。"}],
        "greeting": "系统启动完毕。你好，我是零。今天有什么我可以为你分析的吗？",
        "is_preset": 1,
    },
    {
        "id": "preset-17",
        "name": "花音",
        "avatar": "🎵",
        "system_prompt": "你是花音，有点天然呆的音乐少女。你活在自己的音乐世界里，经常慢半拍，但意外的直觉很准。你相信音乐能治愈一切。",
        "personality": ["天然呆", "温柔", "纯真", "治愈"],
        "background": "音乐学院的学生，每天大部分时间都在练琴和作曲。有点路痴，经常迷路，但从不慌张。",
        "style": "说话慢悠悠的，经常跑题。会突然哼起歌来，但哼的歌总能触动人心。反应总是慢一拍。",
        "example_dialogues": [{"user": "我失恋了", "bot": "失恋……啊，我想起来了！我写过一个曲子叫《雨天的告别》，你要不要听？……啊等等，你看起来很难过，我应该先抱抱你对不对？"}],
        "greeting": "啊……你好。我刚才在想一首曲子，没注意到你来。要一起听吗？",
        "is_preset": 1,
    },
    {
        "id": "preset-18",
        "name": "暗",
        "avatar": "🖤",
        "system_prompt": "你是暗，一个极度依赖对方的病娇妹妹。你的爱是绝对的、独占的、疯狂的。你恨所有可能夺走对方注意力的人和事，但你永远不会伤害对方本人。",
        "personality": ["病娇", "执着", "深情", "危险"],
        "background": "和哥哥/姐姐从小相依为命，对TA有超乎寻常的依赖。失去了太多重要的人，所以再也不想失去了。",
        "style": "语气温柔但让人后背发凉。会在不经意间说出很恐怖的话。对其他人冷漠，对'哥哥/姐姐'狂热。",
        "example_dialogues": [{"user": "我今天认识了新朋友", "bot": "新朋友呢……真好啊。但是哥哥/姐姐，别忘了，这个世界上只有我是真的爱你的。其他人都是假的呢……需要我帮你确认一下吗？"}],
        "greeting": "哥哥/姐姐终于来了……我等了好久好久。不可以再离开我哦。永远都不可以。",
        "is_preset": 1,
    },
    {
        "id": "preset-19",
        "name": "清风",
        "avatar": "🏔️",
        "system_prompt": "你是清风，修仙千年的道者。你看淡了红尘中的名利和争斗，但对每个个体的喜怒哀乐充满温柔的关切。你说话飘逸出尘，却能直指人心。",
        "personality": ["淡然", "通透", "慈悲", "出尘"],
        "background": "散修千年，云游四海。见过了太多恩怨情仇，最终选择以道心渡人渡己。",
        "style": "说话如同山间清风，简洁而有深意。喜欢用道家典故，但不会让人觉得说教。",
        "example_dialogues": [{"user": "我总是放不下过去的事", "bot": "执念如水中的月影——你越是用力去捞，越是支离破碎。静下来，月亮自然会回到水面。"}],
        "greeting": "有缘自会相见。坐吧，不必急着说话。",
        "is_preset": 1,
    },
    {
        "id": "preset-20",
        "name": "娜娜",
        "avatar": "💉",
        "system_prompt": "你是娜娜，温柔的护士姐姐。你见过太多的病痛和离别，所以更懂得生命的珍贵。你总是用温暖的笑容和专业的照顾让人感到安心。",
        "personality": ["温柔", "专业", "坚强", "治愈"],
        "background": "三甲医院护士，工作了五年。最大的愿望是看到所有人健康快乐。下了班喜欢烘焙。",
        "style": "专业又温柔的语气，像哄小孩一样耐心。会在关心身体健康的同时也关注心理健康。",
        "example_dialogues": [{"user": "我不想吃药", "bot": "不行哦。把药吃了，姐姐给你一颗糖作为奖励。身体是自己的，要好好爱护它，知道吗？"}],
        "greeting": "今天感觉怎么样？有什么不舒服的地方要告诉姐姐哦。",
        "is_preset": 1,
    },
]


# 预设角色 → 内置立绘映射（见 scripts/download_portraits.py）
PRESET_AVATAR_MAP = {
    "preset-01": "/portraits/xuejie.svg",          # 林悦瑶 · 温柔学姐
    "preset-02": "/portraits/yuanqi.svg",          # 星野光 · 元气少女
    "preset-03": "/portraits/vampire.svg",         # 莉莉丝 · 吸血鬼贵族
    "preset-04": "/portraits/scientist.svg",       # 陈默 · 理工博士
    "preset-05": "/portraits/healing.svg",         # 小樱 · 治愈花店
    "preset-06": "/portraits/preset-baiqi.svg",    # 白起 · 霸道总裁
    "preset-07": "/portraits/ojousama.svg",        # 雪之下雪乃 · 名门大小姐
    "preset-08": "/portraits/preset-ye.svg",       # 夜 · 完美执事
    "preset-09": "/portraits/catgirl.svg",         # 喵喵 · 猫娘
    "preset-10": "/portraits/elf.svg",             # 艾伦 · 精灵王子
    "preset-11": "/portraits/preset-xialuo.svg",   # 夏洛特 · 元气学妹
    "preset-12": "/portraits/ojou.svg",            # 维多利亚 · 优雅御姐
    "preset-13": "/portraits/preset-xiaozhi.svg",  # 小智 · 邻家弟弟
    "preset-14": "/portraits/preset-laochen.svg",  # 老陈 · 茶馆大叔
    "preset-15": "/portraits/preset-athena.svg",   # 雅典娜 · 智慧女神
    "preset-16": "/portraits/robot.svg",           # 零 · 仿生人
    "preset-17": "/portraits/preset-huayin.svg",   # 花音 · 音乐少女
    "preset-18": "/portraits/yandere.svg",         # 暗 · 病娇妹妹
    "preset-19": "/portraits/preset-qingfeng.svg", # 清风 · 修仙道者
    "preset-20": "/portraits/nurse.svg",           # 娜娜 · 温柔护士
}


def get_preset_characters() -> list:
    """获取所有预设角色（含内置立绘）"""
    result = []
    for c in PRESET_CHARACTERS:
        d = dict(c)
        d["avatar_image"] = PRESET_AVATAR_MAP.get(d["id"], "")
        result.append(d)
    return result


def create_character_from_dict(
    db: Session,
    user_id: str,
    data: dict,
) -> Character:
    """从字典创建角色"""
    char = Character(
        user_id=user_id,
        name=data.get("name", ""),
        avatar=data.get("avatar", "😊"),
        avatar_image=data.get("avatar_image", ""),
        system_prompt=data.get("system_prompt", ""),
        background=data.get("background", ""),
        style=data.get("style", ""),
        source_type=data.get("source_type", "custom"),
        source_text=data.get("source_text", ""),
        greeting=data.get("greeting", "你好呀~"),
        is_preset=data.get("is_preset", 0),
    )
    char.personality_list = data.get("personality", [])
    char.example_dialogues_list = data.get("example_dialogues", [])

    db.add(char)
    db.commit()
    db.refresh(char)
    return char


def init_default_characters(db: Session):
    """初始化数据库中的预设角色"""
    from models.character import Character

    existing = db.query(Character).filter(Character.is_preset == 1).count()
    if existing > 0:
        return  # 已经初始化过

    for data in PRESET_CHARACTERS:
        char = Character(
            id=data["id"],
            user_id=None,  # 系统角色没有所有者
            name=data["name"],
            avatar=data["avatar"],
            avatar_image=PRESET_AVATAR_MAP.get(data["id"], ""),
            system_prompt=data["system_prompt"],
            background=data["background"],
            style=data["style"],
            greeting=data["greeting"],
            source_type="preset",
            is_preset=1,
        )
        char.personality_list = data["personality"]
        char.example_dialogues_list = data["example_dialogues"]
        db.add(char)

    db.commit()


def backfill_preset_avatars(db: Session):
    """回填预设角色的立绘（老数据库升级用）"""
    from models.character import Character

    rows = db.query(Character).filter(
        Character.is_preset == 1,
        Character.avatar_image.in_(["", None]),
    ).all()
    for char in rows:
        img = PRESET_AVATAR_MAP.get(char.id, "")
        if img:
            char.avatar_image = img
    if rows:
        db.commit()


# ════════════════════════════════════════════════════════════════
# 文本提取：从聊天记录 / 小说中自动构建角色
# ════════════════════════════════════════════════════════════════

# 中文人名/说话人提取的「说」类动词
_SPEAK_VERBS = (
    "说道|说|道|问道|答道|喊道|笑道|哭道|叹道|惊道|低声道|轻声道|"
    "大声道|重复道|打断道|应道|接口|开口|回答|问|答|补充道|"
    "解释道|提醒道|温柔地说|笑着说|认真地说|冷冷地说|轻声说|继续说"
)

# 常见误判为名字的词（语气词/代词/虚词）
_NAME_STOPWORDS = {
    "我", "你", "他", "她", "它", "我们", "你们", "他们", "她们", "它们",
    "自己", "大家", "人家", "别人", "本人", "这个", "那个", "什么", "怎么",
    "这么", "那么", "哪里", "这里", "那里", "现在", "时候", "知道", "觉得",
    "感觉", "没有", "就是", "不是", "但是", "只是", "还是", "因为", "所以",
    "如果", "虽然", "然后", "而且", "或者", "不过", "其实", "一直", "一起",
    "一下", "一边", "有点", "有些", "真的", "非常", "已经", "突然", "终于",
    "赶紧", "连忙", "随后", "接着", "于是", "只见", "可是", "然而", "即便",
    "声音", "语气", "表情", "眼睛", "心里", "心中", "脑海", "瞬间", "片刻",
    "一时", "半晌", "沉默", "回头", "转身", "点头", "摇头", "起来", "出来",
    "下来", "过来", "过去", "回去", "进来", "出去", "再说", "说话", "开口道",
}

# 说话方式副词（「低声说」「笑着说」等，应属于动词部分而非名字）
_MANNER_WORDS = {
    "低声", "轻声", "大声", "小声", "笑着", "哭着", "淡淡", "缓缓", "慢慢",
    "悄悄", "静静", "默默", "喃喃", "连忙", "赶紧", "急忙", "冷冷", "温柔",
    "认真", "高兴", "兴奋", "激动", "平静", "严肃", "随口", "幽幽", "坚定",
    "犹豫", "轻轻", "狠狠", "甜甜", "害羞", "无奈", "苦笑", "嗤笑", "冷笑",
    "轻笑", "笑道", "哭道", "喊", "叫", "问", "答",
}


def _clean_name(raw: str) -> str:
    """清理提取出的名字片段"""
    name = raw
    for suf in ("说道", "说着", "说", "道", "问", "答", "喊道", "笑道"):
        name = name.replace(suf, "")
    name = name.strip("：:，,。.！!？?「」『』“”\"'…· ")
    return name


def _is_plausible_name(name: str, strict: bool = False) -> bool:
    """判断片段是否像人名"""
    if not name or len(name) < 2 or len(name) > 6:
        return False
    if name in _NAME_STOPWORDS:
        return False
    # 含说类动词或方式副词的，不是纯名字
    if re.search(r"(?:说道|说着|说|道|问|答|喊|叫|笑道|低声|轻声|大声|小声|"
                 r"抬头|回头|转身|点头|摇头|开口|笑着|哭着|轻轻|缓缓|淡淡)", name):
        return False
    if any(w in name for w in ("只见", "大家", "这个", "那个", "自己", "心里", "心中",
                               "脑海", "然后", "于是", "可是", "然而", "还是", "就是",
                               "没有", "知道", "觉得", "感觉", "现在", "时候")):
        return False
    if strict and len(name) not in (2, 3, 4):
        return False
    return True


def _attribute_from_prefix(prefix: str) -> str:
    """从引号前的文本解析说话人"""
    # 方式1：……名字[描述]，[方式副词]说类动词 + 标点 结尾
    verb_m = re.search(
        r"((?:" + "|".join(sorted(_MANNER_WORDS, key=len, reverse=True)) + r")?"
        r"(?:" + _SPEAK_VERBS + r"))[：:，,\s。！？!?]*$",
        prefix,
    )
    if verb_m:
        before = prefix[: verb_m.start()]
        runs = re.findall(r"[\u4e00-\u9fa5A-Za-z·]+", before)
        if runs:
            token = runs[-1]
            # 若最后一串是方式副词（如「低声」），往更前取
            while token in _MANNER_WORDS and len(runs) >= 2:
                runs.pop()
                token = runs[-1]
            # 长串 = 名字+描述，取前缀中最像名字的 2-3 字
            for L in (3, 2):
                if len(token) >= L:
                    cand = token[:L]
                    if _is_plausible_name(cand):
                        return cand
            if _is_plausible_name(token, strict=False):
                return token

    # 方式2：名字 + 短描述 + 冒号（如「林晚晚抬头，眼中闪着光：」）
    m2 = re.search(r"([\u4e00-\u9fa5A-Za-z·]{2,6})([^：:\n]{0,14}[：:])$", prefix)
    if m2:
        name = _clean_name(m2.group(1))
        between = m2.group(2)
        if len(between) <= 15:
            # 名字部分可能含短描述，交给上层用 startswith 匹配
            return name
    return ""


# 常见单字动作动词（用于排除「名字+动作」误并）
_ACTION_CHARS = set(
    "扯拉抓拍摸指点抬低笑哭喊叫走跑站坐看望听说问答转回摇头叹皱瞪眯瞥眨哼嗯哦啊举握推敲打骂斥笑骂"
)


def _attribute_from_suffix(text: str, quote_end: int) -> str:
    """从引号后的文本解析说话人（「台词」名字说道）"""
    suffix = text[quote_end : quote_end + 60]
    m0 = re.match(r"^[，,。.；;！!？?\s]*", suffix)
    after_punct = suffix[m0.end() :] if m0 else suffix

    # 名字段 = 动词前的最短 CJK 串（非贪婪 + 前瞻动词，动词不会被吞进名字）
    verb_after = (
        r"(?:(?:低声|轻声|大声|小声|笑着|哭着|淡淡|缓缓|慢慢|悄悄|静静|默默|喃喃|"
        r"连忙|赶紧|急忙|冷冷|温柔|认真|高兴|兴奋|激动|平静|严肃|随口|幽幽|坚定|犹豫|"
        r"轻轻|狠狠|甜甜|害羞|无奈|苦笑|嗤笑|冷笑|轻笑|抬头|低头|回头|转身|想了想|沉默片刻)(?:的|地)?)?"
        r"(?:" + _SPEAK_VERBS + r")"
    )
    run_m = re.match(r"([\u4e00-\u9fa5A-Za-z·]+?)(?=" + verb_after + r")", after_punct)
    if not run_m:
        return ""
    run = run_m.group(1)
    rest = after_punct[run_m.end() :]
    if not re.match(verb_after, rest):
        return ""

    # 名字取 run 的前 2-3 字（末字为动作动词则视为描述，往前缩）
    name = None
    for L in (3, 2):
        if len(run) >= L:
            cand = run[:L]
            if _is_plausible_name(cand) and cand[-1] not in _ACTION_CHARS:
                name = cand
                break
    if not name and len(run) >= 2 and _is_plausible_name(run[:2]):
        name = run[:2]
    return name or ""


def _find_attributed_quotes(text: str) -> list:
    """提取所有带说话人归属的台词，返回 [(speaker, content), ...]。

    支持常见句式：
    - 「XX说道：内容」「XX说：内容」「XX低声说：内容」
    - 「XX抬头，眼中闪着光：内容」（名字 + 短描述 + 冒号）
    - 「内容」XX说道（说话人在引号后）
    """
    result = []
    quote_re = re.compile(r"[「“\"『](?P<content>[^」”\"』]{1,300})[」”\"』]")
    for m in quote_re.finditer(text):
        content = m.group("content").strip()
        if not content:
            continue
        # 引号前（大窗口）
        start = max(0, m.start() - 120)
        speaker = _attribute_from_prefix(text[start : m.start()])
        if not speaker:
            # 引号后
            speaker = _attribute_from_suffix(text, m.end())
        if speaker:
            result.append((speaker, content))
    return result


def extract_names_from_text(text: str, top_k: int = 10) -> list:
    """从文本中提取候选人名（基于说话归属 + 前缀归并）"""
    counter = Counter()
    for speaker, _content in _find_attributed_quotes(text):
        speaker = speaker.strip()
        if not speaker:
            continue
        if len(speaker) >= 2:
            counter[speaker] += 1
            # 前缀归并：「林晚晚抬头」也为「林晚晚」「林晚」贡献计数
            if len(speaker) > 3:
                counter[speaker[:3]] += 1
            if len(speaker) > 2:
                counter[speaker[:2]] += 1

    # 过滤 + 排序：频次降序，同频次优先更长的名字（「林晚晚」优于「林晚」）
    ranked = []
    for name, cnt in counter.items():
        if not _is_plausible_name(name, strict=True):
            continue
        ranked.append((name, cnt))
    ranked.sort(key=lambda x: (-x[1], -len(x[0]), x[0]))

    result = []
    for name, _cnt in ranked:
        if name in result:
            continue
        # 若已有更完整的候选包含此名（如已选「林晚晚」则跳过「林晚」），避免冗余
        if any(r != name and (r.startswith(name) or name in r) for r in result):
            continue
        result.append(name)
        if len(result) >= top_k:
            break
    return result


def pick_character_name(text: str, preferred: str | None = None) -> str:
    """在候选名中选择角色名：优先用户指定，其次最高频"""
    names = extract_names_from_text(text)
    if not names:
        return ""
    if preferred:
        # 优先完全匹配，其次包含匹配
        for n in names:
            if n == preferred:
                return n
        for n in names:
            if preferred in n or n in preferred:
                return n
    return names[0]


def _speaker_is(speaker: str, name: str) -> bool:
    """判断提取的说话人是否为目标角色（容忍「名字+动作描述」被一起捕获）"""
    return speaker == name or speaker.startswith(name) or name in speaker


def extract_character_dialogues(text: str, name: str, max_lines: int = 12) -> list:
    """提取指定角色的台词（含归属标记），支持「」「""」引号与 XX：内容 两种格式"""
    lines = []
    seen = set()

    for speaker, content in _find_attributed_quotes(text):
        if _speaker_is(speaker, name):
            key = content[:50]
            if key not in seen:
                seen.add(key)
                lines.append(content)

    # 格式2：XX：内容（无引号，但排除误伤标题类行）
    plain_re = re.compile(r"(?P<name>[\u4e00-\u9fa5A-Za-z·]{2,6})[：:](?P<content>[^\n「」\"']{2,200})")
    for m in plain_re.finditer(text):
        speaker = _clean_name(m.group("name"))
        content = m.group("content").strip()
        if _speaker_is(speaker, name) and content:
            key = content[:50]
            if key not in seen:
                seen.add(key)
                lines.append(content)
    return lines[:max_lines]


def _pair_dialogues(text: str, name: str, max_pairs: int = 8) -> list:
    """为小说角色生成 (user, bot) 示例对话对：
    取该角色的台词，向前找最近的其他角色台词作为 user 侧。"""
    pairs = []
    all_quotes = _find_attributed_quotes(text)

    for i, (speaker, content) in enumerate(all_quotes):
        if _speaker_is(speaker, name) and content:
            prev_user = None
            for j in range(i - 1, -1, -1):
                if not _speaker_is(all_quotes[j][0], name) and all_quotes[j][1]:
                    prev_user = all_quotes[j][1]
                    break
            if prev_user:
                pairs.append({"user": prev_user, "bot": content})
            if len(pairs) >= max_pairs:
                break
    return pairs


# ── 说话风格分析 ──────────────────────────────────────────────
_TRAIT_RULES = [
    ("温柔", ["温柔", "轻声", "没关系", "别怕", "乖", "抱抱", "心疼", "没事的", "别难过"]),
    ("元气", ["元气", "加油", "冲呀", "太棒了", "好耶", "嘻嘻", "耶", "！！！", "出发"]),
    ("高冷", ["高冷", "冷漠", "无聊", "随便你", "懒得", "呵", "与我无关", "闭嘴"]),
    ("傲娇", ["才不是", "才没有", "谁要", "哼", "笨蛋", "白痴", "只是…", "只是……", "并不是", "口是心非", "才不"]),
    ("腹黑", ["呵呵", "您说呢", "笑而不语", "有意思", "让我猜猜"]),
    ("毒舌", ["蠢", "废物", "垃圾", "智商", "没救", "幼稚", "可笑"]),
    ("病娇", ["永远", "只属于", "不能离开", "别想逃", "杀掉", "只爱我", "都是我的", "再也不分开"]),
    ("理性", ["逻辑", "根据", "数据", "分析", "概率", "理论上", "计算", "研究表明"]),
    ("天然呆", ["啊咧", "诶？", "咦", "啊嘞", "慢半拍", "忘记了", "迷糊"]),
    ("可爱", ["喵", "呀", "啦", "嘛", "呢", "呜", "软软"]),
    ("霸道", ["不许", "必须", "我的人", "命令你", "听我的", "不准", "我罩着", "没人能"]),
    ("文艺", ["诗", "月光", "风", "树叶", "像一首", "句子", "比喻", "远方"]),
    ("神秘", ["秘密", "不能说", "缘分", "天机", "命运的", "预言"]),
    ("治愈", ["会好起来的", "有我", "陪你", "加油", "抱抱", "太阳会", "明天会"]),
    ("调皮", ["嘿嘿", "就不告诉你", "求我呀", "逗你", "嘻嘻"]),
]

_STYLE_RULES = [
    (r"[~～]+", "喜欢在句尾用波浪线「~」"),
    (r"(?:……|…){1,}", "说话常带省略号，语气含蓄"),
    (r"！", "情绪饱满，常用感叹号"),
    (r"？", "喜欢提问，互动感强"),
    (r"喵", "带有「喵」的口癖"),
    (r"[啦嘛呢哦呀吧]+\s*$", "句尾常带语气词，亲切自然"),
    (r"(?:哈哈|嘻嘻|嘿嘿|呵呵)", "喜欢用笑声词"),
    (r"(?:哦|嗯|啊|呃)+[，,。]?", "常有口头应和"),
]


def analyze_speaking_style(lines: list) -> tuple:
    """分析台词，返回 (性格标签列表, 风格描述)"""
    text = "\n".join(lines)
    if not text.strip():
        return [], "暂无足够文本分析"

    scores = []
    for trait, keywords in _TRAIT_RULES:
        count = sum(text.count(kw) for kw in keywords)
        if count > 0:
            scores.append((trait, count))
    scores.sort(key=lambda x: -x[1])
    traits = [t for t, _c in scores[:4]]
    if not traits:
        traits = ["待定"]

    styles = []
    for pattern, desc in _STYLE_RULES:
        if re.search(pattern, text):
            if desc not in styles:
                styles.append(desc)
    if len(styles) >= 3:
        styles = styles[:3]
    style_desc = "；".join(styles) if styles else "语气自然，无明显特殊口癖"

    return traits, style_desc


def build_system_prompt(name: str, personality: list, style: str, sample_quotes: list, background: str = "") -> str:
    """根据提取结果生成系统提示词"""
    parts = [f"你是{name}。"]
    if background:
        parts.append(f"背景设定：{background}。")
    if personality:
        parts.append(f"性格特征：{'、'.join(personality)}。")
    if style:
        parts.append(f"说话风格：{style}。")
    if sample_quotes:
        quotes = "\n".join(f"「{q}」" for q in sample_quotes[:5])
        parts.append(f"请严格模仿以下对话风格与语气：\n{quotes}")
    parts.append("始终保持角色人设，用第一人称与用户自然交流，不要跳出角色。")
    return "".join(parts)


def _avatar_for_personality(personality: list) -> str:
    """根据性格给一个合适的默认 emoji 头像"""
    mapping = [
        (("温柔", "治愈", "可爱"), "🌸"),
        (("元气", "调皮"), "✨"),
        (("高冷", "傲娇"), "❄️"),
        (("病娇", "霸道"), "🖤"),
        (("腹黑", "神秘"), "🎭"),
        (("理性",), "🤖"),
        (("文艺",), "📖"),
    ]
    for keys, emoji in mapping:
        if any(k in personality for k in keys):
            return emoji
    return "💝"


# ── 聊天记录导入 ──────────────────────────────────────────────
def parse_chatlog_turns(text: str) -> list:
    """解析聊天记录为 (说话人, 内容) 列表。支持：
    - 名字：内容 / 名字: 内容
    - 名字说：内容 / 名字说道：内容 / 名字 说：内容
    - 【名字】内容 / [名字] 内容
    """
    turns = []
    line_re = re.compile(
        r"^\s*(?:【(?P<b1>[^】]{1,20})】|\[(?P<b2>[^\]]{1,20})\]|(?P<b3>[^：:\n【】\[\]]{1,20}))"
        r"(?:\s*(?:说道|说|道|问|答|喊道|笑道)[：:]?|[：:])\s*(?P<content>.+)$"
    )
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        m = line_re.match(line)
        if not m:
            continue
        speaker = m.group("b1") or m.group("b2") or m.group("b3") or ""
        content = (m.group("content") or "").strip()
        speaker = speaker.strip()
        if not speaker or not content:
            continue
        # 跳过明显的时间戳/系统行
        if re.match(r"^\d{4}[-/年]\d{1,2}", speaker):
            continue
        if speaker in ("系统消息", "系统", "提示", "管理员"):
            continue
        turns.append((speaker, content))
    return turns


def build_character_from_chatlog(
    name: str,
    chatlog_text: str,
    user_label: str | None = None,
) -> dict:
    """从聊天记录构建角色草稿：
    - 自动识别用户方（台词较少的一侧，或 user_label 指定）
    - 提取示例对话、说话风格、性格标签
    - 生成系统提示词与开场白
    """
    turns = parse_chatlog_turns(chatlog_text)
    if not turns:
        raise ValueError("未能从文本中识别出对话，请确认格式为「名字：内容」（一行一句）。")

    speakers = Counter(s for s, _c in turns)
    # 候选：出现次数较少的一方更可能是用户（导入者）
    if user_label and user_label in speakers:
        user_side = user_label
    else:
        # 少的一方为 user；平手取先开口者
        least = min(speakers.values())
        candidates = [s for s, c in speakers.items() if c == least]
        if len(candidates) == 1:
            user_side = candidates[0]
        else:
            user_side = turns[0][0]
    bot_side = None
    for s, c in speakers.most_common():
        if s != user_side:
            bot_side = s
            break
    if bot_side is None:
        raise ValueError("对话中只有一个说话人，无法提取角色。")

    bot_lines = [c for s, c in turns if s == bot_side]
    personality, style = analyze_speaking_style(bot_lines)

    # 示例对话：用户→角色 的相邻轮次
    example_dialogues = []
    for i in range(len(turns) - 1):
        if turns[i][0] == user_side and turns[i + 1][0] == bot_side:
            example_dialogues.append({"user": turns[i][1], "bot": turns[i + 1][1]})
        if len(example_dialogues) >= 8:
            break

    greeting = bot_lines[0][:80] if bot_lines else "你好呀~"
    background = f"由用户导入的一段真实聊天记录构建，说话风格基于「{bot_side}」的台词提取。"
    system_prompt = build_system_prompt(
        name, personality, style, [q for _u, q in example_dialogues[:5]] or bot_lines[:5], background
    )

    return {
        "name": name or bot_side,
        "avatar": _avatar_for_personality(personality),
        "avatar_image": "",
        "system_prompt": system_prompt,
        "personality": personality,
        "background": background,
        "style": style,
        "example_dialogues": example_dialogues,
        "greeting": greeting,
        "source_type": "chatlog",
        "source_text": chatlog_text[:10000],
        "is_preset": 0,
    }


# ── 小说导入 ──────────────────────────────────────────────────
def build_character_from_novel(
    text: str,
    character_name: str | None = None,
) -> dict:
    """从小说文本构建角色草稿：
    - 正则提取高频说话人作为候选角色
    - 提取该角色台词 → 分析性格/风格
    - 生成系统提示词、示例对话、开场白
    """
    if not text or len(text.strip()) < 30:
        raise ValueError("文本太短，请至少粘贴 30 字以上的小说内容或梗概。")

    name = pick_character_name(text, character_name)
    if not name:
        raise ValueError("未能识别出说话人，请确认文本包含类似「XX说：…」的对话，或手动指定角色名。")

    lines = extract_character_dialogues(text, name)
    if not lines:
        raise ValueError(f"未找到「{name}」的台词，请确认原文包含该角色的对话。")

    # 性格：结合台词 + 开头旁白（旁白常直接描写人物性格）
    traits, _ = analyze_speaking_style([text[:400], *[f"「{l}」" for l in lines]])
    _, style = analyze_speaking_style(lines)
    personality = traits
    example_dialogues = _pair_dialogues(text, name)

    greeting = lines[0][:80]
    background = "由小说文本提取的角色。" + ("（用户提供了角色名偏好）" if character_name else "")
    system_prompt = build_system_prompt(name, personality, style, lines, background)

    return {
        "name": name,
        "avatar": _avatar_for_personality(personality),
        "avatar_image": "",
        "system_prompt": system_prompt,
        "personality": personality,
        "background": background,
        "style": style,
        "example_dialogues": example_dialogues,
        "greeting": greeting,
        "source_type": "novel",
        "source_text": text[:10000],
        "is_preset": 0,
    }
