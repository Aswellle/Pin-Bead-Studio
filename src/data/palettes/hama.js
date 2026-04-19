// Hama Beads - Medium (5mm) solid colors with calibrated RGB values
// RGB values represent actual plastic bead pigmentation
export const HAMA_PALETTE = {
  id: 'hama',
  name: 'Hama Beads',
  nameZh: 'Hama 拼豆',
  origin: '丹麦',
  beadSize: 5,
  beadSizeLabel: '中颗粒 (5mm)',
  colorCount: 56,
  website: 'https://www.hama.be',

  colors: [
    // --- Neutrals ---
    { id: 'H01', name: 'White',         nameZh: '白色',     hex: '#F7F5F0', rgb: { r: 247, g: 245, b: 240 }, category: 'neutral' },
    { id: 'H02', name: 'Cream',         nameZh: '奶油色',   hex: '#F4E5B0', rgb: { r: 244, g: 229, b: 176 }, category: 'neutral' },
    { id: 'H03', name: 'Toasted',       nameZh: '烘焙色',   hex: '#E6D0A2', rgb: { r: 230, g: 208, b: 162 }, category: 'neutral' },
    { id: 'H04', name: 'Black',         nameZh: '黑色',     hex: '#101010', rgb: { r: 16,  g: 16,  b: 16  }, category: 'neutral' },
    { id: 'H05', name: 'Charcoal',      nameZh: '炭灰色',   hex: '#3A3A3A', rgb: { r: 58,  g: 58,  b: 58  }, category: 'neutral' },
    { id: 'H06', name: 'Dark Gray',     nameZh: '深灰色',   hex: '#525252', rgb: { r: 82,  g: 82,  b: 82  }, category: 'neutral' },
    { id: 'H07', name: 'Gray',          nameZh: '灰色',     hex: '#919191', rgb: { r: 145, g: 145, b: 145 }, category: 'neutral' },
    { id: 'H08', name: 'Light Gray',    nameZh: '浅灰色',   hex: '#BCBCBC', rgb: { r: 188, g: 188, b: 188 }, category: 'neutral' },

    // --- Browns & Skins ---
    { id: 'H09', name: 'Dark Brown',    nameZh: '深棕色',   hex: '#482814', rgb: { r: 72,  g: 40,  b: 20  }, category: 'brown'   },
    { id: 'H10', name: 'Brown',         nameZh: '棕色',     hex: '#724626', rgb: { r: 114, g: 70,  b: 38  }, category: 'brown'   },
    { id: 'H11', name: 'Cinnamon',      nameZh: '肉桂色',   hex: '#9C5634', rgb: { r: 156, g: 86,  b: 52  }, category: 'brown'   },
    { id: 'H12', name: 'Caramel',       nameZh: '焦糖色',   hex: '#A06432', rgb: { r: 160, g: 100, b: 50  }, category: 'brown'   },
    { id: 'H13', name: 'Tan',           nameZh: '棕褐色',   hex: '#C09B6A', rgb: { r: 192, g: 155, b: 106 }, category: 'brown'   },
    { id: 'H14', name: 'Sand',          nameZh: '沙色',     hex: '#D8BC94', rgb: { r: 216, g: 188, b: 148 }, category: 'brown'   },
    { id: 'H15', name: 'Peach',         nameZh: '桃色',     hex: '#F0B28A', rgb: { r: 240, g: 178, b: 138 }, category: 'skin'    },
    { id: 'H16', name: 'Flesh',         nameZh: '肤色',     hex: '#E2A276', rgb: { r: 226, g: 162, b: 118 }, category: 'skin'    },
    { id: 'H17', name: 'Blush',         nameZh: '腮红色',   hex: '#EEBEBC', rgb: { r: 238, g: 190, b: 188 }, category: 'skin'    },

    // --- Reds ---
    { id: 'H18', name: 'Dark Red',      nameZh: '深红色',   hex: '#861D1E', rgb: { r: 134, g: 29,  b: 30  }, category: 'red'     },
    { id: 'H19', name: 'Red',           nameZh: '红色',     hex: '#C82428', rgb: { r: 200, g: 36,  b: 40  }, category: 'red'     },
    { id: 'H20', name: 'Rust',          nameZh: '锈红色',   hex: '#A43C24', rgb: { r: 164, g: 60,  b: 36  }, category: 'red'     },
    { id: 'H21', name: 'Bittersweet',   nameZh: '苦甜色',   hex: '#C04830', rgb: { r: 192, g: 72,  b: 48  }, category: 'red'     },
    { id: 'H22', name: 'Orange Red',    nameZh: '橙红色',   hex: '#DE4428', rgb: { r: 222, g: 68,  b: 40  }, category: 'red'     },

    // --- Oranges & Yellows ---
    { id: 'H23', name: 'Dark Orange',   nameZh: '深橙色',   hex: '#DA5518', rgb: { r: 218, g: 85,  b: 24  }, category: 'orange'  },
    { id: 'H24', name: 'Orange',        nameZh: '橙色',     hex: '#EE6E22', rgb: { r: 238, g: 110, b: 34  }, category: 'orange'  },
    { id: 'H25', name: 'Butterscotch',  nameZh: '奶油糖',   hex: '#D69E3C', rgb: { r: 214, g: 158, b: 60  }, category: 'yellow'  },
    { id: 'H26', name: 'Golden',        nameZh: '金色',     hex: '#C09024', rgb: { r: 192, g: 144, b: 36  }, category: 'yellow'  },
    { id: 'H27', name: 'Yellow',        nameZh: '黄色',     hex: '#FCDA00', rgb: { r: 252, g: 218, b: 0   }, category: 'yellow'  },
    { id: 'H28', name: 'Lemon',         nameZh: '柠檬色',   hex: '#FFEA52', rgb: { r: 255, g: 234, b: 82  }, category: 'yellow'  },
    { id: 'H29', name: 'Light Yellow',  nameZh: '浅黄色',   hex: '#F8EE90', rgb: { r: 248, g: 238, b: 144 }, category: 'yellow'  },

    // --- Greens ---
    { id: 'H30', name: 'Olive',         nameZh: '橄榄色',   hex: '#6C7A30', rgb: { r: 108, g: 122, b: 48  }, category: 'green'   },
    { id: 'H31', name: 'Dark Green',    nameZh: '深绿色',   hex: '#185C2E', rgb: { r: 24,  g: 92,  b: 46  }, category: 'green'   },
    { id: 'H32', name: 'Green',         nameZh: '绿色',     hex: '#309238', rgb: { r: 48,  g: 146, b: 56  }, category: 'green'   },
    { id: 'H33', name: 'Shamrock',      nameZh: '三叶草绿', hex: '#2E8C42', rgb: { r: 46,  g: 140, b: 66  }, category: 'green'   },
    { id: 'H34', name: 'Light Green',   nameZh: '浅绿色',   hex: '#9CCC8A', rgb: { r: 156, g: 204, b: 138 }, category: 'green'   },
    { id: 'H35', name: 'Pastel Green',  nameZh: '粉绿色',   hex: '#A4CE94', rgb: { r: 164, g: 206, b: 148 }, category: 'green'   },

    // --- Cyans & Teals ---
    { id: 'H36', name: 'Mint',          nameZh: '薄荷色',   hex: '#A2D0C0', rgb: { r: 162, g: 208, b: 192 }, category: 'cyan'    },
    { id: 'H37', name: 'Teal',          nameZh: '水鸭色',   hex: '#1E9292', rgb: { r: 30,  g: 146, b: 146 }, category: 'cyan'    },
    { id: 'H38', name: 'Dark Teal',     nameZh: '深水鸭色', hex: '#16686E', rgb: { r: 22,  g: 104, b: 110 }, category: 'cyan'    },
    { id: 'H39', name: 'Turquoise',     nameZh: '绿松石',   hex: '#1CA2B8', rgb: { r: 28,  g: 162, b: 184 }, category: 'cyan'    },
    { id: 'H40', name: 'Cyan',          nameZh: '青色',     hex: '#28B4C4', rgb: { r: 40,  g: 180, b: 196 }, category: 'cyan'    },

    // --- Blues ---
    { id: 'H41', name: 'Navy',          nameZh: '海军蓝',   hex: '#122A74', rgb: { r: 18,  g: 42,  b: 116 }, category: 'blue'    },
    { id: 'H42', name: 'Blue',          nameZh: '蓝色',     hex: '#2264A6', rgb: { r: 34,  g: 100, b: 166 }, category: 'blue'    },
    { id: 'H43', name: 'Sky Blue',      nameZh: '天蓝色',   hex: '#56A2CA', rgb: { r: 86,  g: 162, b: 202 }, category: 'blue'    },
    { id: 'H44', name: 'Light Blue',    nameZh: '浅蓝色',   hex: '#82B7D8', rgb: { r: 130, g: 183, b: 216 }, category: 'blue'    },
    { id: 'H45', name: 'Pastel Blue',   nameZh: '粉蓝色',   hex: '#9AC6E0', rgb: { r: 154, g: 198, b: 224 }, category: 'blue'    },
    { id: 'H46', name: 'Periwinkle',    nameZh: '长春花色', hex: '#7088C2', rgb: { r: 112, g: 136, b: 194 }, category: 'blue'    },

    // --- Purples ---
    { id: 'H47', name: 'Purple',        nameZh: '紫色',     hex: '#702C80', rgb: { r: 112, g: 44,  b: 128 }, category: 'purple'  },
    { id: 'H48', name: 'Light Purple',  nameZh: '浅紫色',   hex: '#A86EAC', rgb: { r: 168, g: 110, b: 172 }, category: 'purple'  },
    { id: 'H49', name: 'Lavender',      nameZh: '薰衣草',   hex: '#C0A2CC', rgb: { r: 192, g: 162, b: 204 }, category: 'purple'  },

    // --- Pinks & Magentas ---
    { id: 'H50', name: 'Magenta',       nameZh: '品红色',   hex: '#C82480', rgb: { r: 200, g: 36,  b: 128 }, category: 'pink'    },
    { id: 'H51', name: 'Hot Pink',      nameZh: '亮粉色',   hex: '#DC3476', rgb: { r: 220, g: 52,  b: 118 }, category: 'pink'    },
    { id: 'H52', name: 'Pink',          nameZh: '粉色',     hex: '#F07898', rgb: { r: 240, g: 120, b: 152 }, category: 'pink'    },
    { id: 'H53', name: 'Flamingo',      nameZh: '火烈鸟粉', hex: '#EC98A8', rgb: { r: 236, g: 152, b: 168 }, category: 'pink'    },
    { id: 'H54', name: 'Light Pink',    nameZh: '浅粉色',   hex: '#F5B3C7', rgb: { r: 245, g: 179, b: 199 }, category: 'pink'    },
    { id: 'H55', name: 'Dark Pink',     nameZh: '深粉色',   hex: '#CC3266', rgb: { r: 204, g: 50,  b: 102 }, category: 'pink'    },
    { id: 'H56', name: 'Rose',          nameZh: '玫瑰色',   hex: '#D84080', rgb: { r: 216, g: 64,  b: 128 }, category: 'pink'    },
  ],

  categories: [
    { id: 'neutral', name: 'Neutral', nameZh: '中性色', count: 8  },
    { id: 'brown',   name: 'Brown',   nameZh: '棕色系', count: 6  },
    { id: 'skin',    name: 'Skin',    nameZh: '肤色系', count: 3  },
    { id: 'red',     name: 'Red',     nameZh: '红色系', count: 5  },
    { id: 'orange',  name: 'Orange',  nameZh: '橙色系', count: 2  },
    { id: 'yellow',  name: 'Yellow',  nameZh: '黄色系', count: 5  },
    { id: 'green',   name: 'Green',   nameZh: '绿色系', count: 6  },
    { id: 'cyan',    name: 'Cyan',    nameZh: '青色系', count: 5  },
    { id: 'blue',    name: 'Blue',    nameZh: '蓝色系', count: 6  },
    { id: 'purple',  name: 'Purple',  nameZh: '紫色系', count: 3  },
    { id: 'pink',    name: 'Pink',    nameZh: '粉色系', count: 7  },
  ]
}
