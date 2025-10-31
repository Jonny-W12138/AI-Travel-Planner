/**
 * 地图模块
 */

class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.polylines = []; // 存储路径线
    }

    initMap(container = 'map') {
        console.log('🗺️ 初始化地图...');
        console.log('🗺️ 容器ID:', container);
        console.log('🗺️ 浏览器:', navigator.userAgent);
        
        // 检查 AMap 是否已加载
        if (!window.AMap) {
            console.error('❌ 高德地图 API 未加载');
            console.log('   等待 AMap 加载...');
            
            // 等待 AMap 加载完成
            const checkAMap = () => {
                if (window.AMap) {
                    console.log('✅ 高德地图 API 已加载');
                    this._doInitMap(container);
                } else {
                    console.log('   继续等待 AMap...');
                    setTimeout(checkAMap, 100);
                }
            };
            
            // 监听 AMap 加载事件
            window.addEventListener('amapLoaded', () => {
                console.log('✅ 收到 AMap 加载事件');
                this._doInitMap(container);
            });
            
            // 备用检查
            setTimeout(checkAMap, 100);
            return;
        }
        
        console.log('✅ 高德地图 API 已加载');
        console.log('🗺️ AMap 版本:', AMap.v);
        this._doInitMap(container);
    }
    
    _doInitMap(container) {
        
        // 检查容器是否存在
        const containerElement = document.getElementById(container);
        if (!containerElement) {
            console.error('❌ 地图容器不存在:', container);
            return;
        }
        console.log('✅ 地图容器存在, 尺寸:', containerElement.offsetWidth, 'x', containerElement.offsetHeight);

        try {
            // 根据高德地图文档推荐的配置
            this.map = new AMap.Map(container, {
                zoom: 12,
                center: [118.796877, 32.060255], // 南京中心
                viewMode: '2D', // 使用 2D 模式，兼容性更好
                resizeEnable: true,
                rotateEnable: false,
                pitchEnable: false,
                expandZoomRange: true,
                zooms: [3, 20],
                // 明确指定要显示的图层，确保底图显示
                features: ['bg', 'road', 'building', 'point'],
                // 添加地图样式，确保底图可见
                mapStyle: 'amap://styles/normal'
            });
            
            console.log('✅ 地图对象创建成功:', this.map);
            
            // 添加地图错误监听
            this.map.on('error', (e) => {
                console.error('❌ 地图错误:', e);
            });
            
            // 强制刷新地图
            setTimeout(() => {
                try {
                    this.map.setZoom(12);
                    this.map.setCenter([118.796877, 32.060255]);
                    console.log('🔄 地图已刷新');
                    
                    // 检查地图是否真的显示了
                    setTimeout(() => {
                        const mapContainer = document.getElementById(container);
                        const canvas = mapContainer.querySelector('canvas');
                        if (!canvas || canvas.width === 0 || canvas.height === 0) {
                            console.error('❌ 地图 Canvas 未正确渲染');
                            console.log('   容器尺寸:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
                            console.log('   Canvas尺寸:', canvas ? canvas.width + 'x' + canvas.height : '不存在');
                            
                            // 尝试重新初始化
                            console.log('🔄 尝试重新初始化地图...');
                            this.map.destroy();
                            setTimeout(() => {
                                this._doInitMap(container);
                            }, 500);
                        } else {
                            console.log('✅ 地图 Canvas 渲染正常');
                        }
                    }, 1000);
                } catch (error) {
                    console.error('❌ 地图刷新失败:', error);
                }
            }, 100);
            
            // 监听地图加载完成事件
            this.map.on('complete', () => {
                console.log('🗺️ 地图加载完成');
                console.log('🗺️ 地图状态检查:');
                console.log('  - 缩放级别:', this.map.getZoom());
                console.log('  - 中心点:', this.map.getCenter());
                console.log('  - 地图样式:', this.map.getMapStyle());
                console.log('  - 容器尺寸:', this.map.getSize());
                console.log('  - 图层数量:', this.map.getAllOverlays().length);
                
                // 检查地图Canvas元素
                const mapContainer = document.getElementById('map');
                const canvas = mapContainer.querySelector('canvas');
                console.log('  - Canvas元素存在:', !!canvas);
                if (canvas) {
                    console.log('  - Canvas尺寸:', canvas.width, 'x', canvas.height);
                }
            });
            
            // 监听地图错误事件
            this.map.on('error', (error) => {
                console.error('❌ 地图加载错误:', error);
            });

            // 高德地图 2.0 版本的控件添加方式
            try {
                // 添加比例尺控件
                AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
                    this.map.addControl(new AMap.Scale());
                    this.map.addControl(new AMap.ToolBar({
                        position: {
                            top: '110px',
                            right: '40px'
                        }
                    }));
                    console.log('✅ 地图控件已添加');
                });
            } catch (error) {
                console.warn('⚠️ 地图控件添加失败，但不影响基本功能:', error);
            }
            
            console.log('✅ 地图初始化完成');
        } catch (error) {
            console.error('❌ 地图初始化失败:', error);
            console.error('   错误详情:', error.message);
            console.error('   错误堆栈:', error.stack);
            
            // 尝试使用 Loader 方式重新加载
            console.log('🔄 尝试使用 Loader 方式重新加载地图...');
            this._initMapWithLoader(container);
        }
    }
    
    // 备用方法：使用 Loader 方式加载地图
    _initMapWithLoader(container) {
        if (!window.AMapLoader) {
            console.error('❌ AMapLoader 不可用');
            return;
        }
        
        AMapLoader.load({
            key: '95828c7f5a2eb9b1b8feb439fabb22f8',
            version: '2.0',
            plugins: ['AMap.Scale', 'AMap.ToolBar']
        }).then((AMap) => {
            console.log('✅ AMapLoader 加载成功');
            
            this.map = new AMap.Map(container, {
                zoom: 12,
                center: [118.796877, 32.060255],
                viewMode: '2D',
                mapStyle: 'amap://styles/normal'
            });
            
            console.log('✅ Loader 方式地图创建成功');
            
        }).catch((error) => {
            console.error('❌ AMapLoader 加载失败:', error);
        });
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.remove(marker);
        });
        this.markers = [];
        
        // 清除路径线
        this.polylines.forEach(polyline => {
            this.map.remove(polyline);
        });
        this.polylines = [];
    }

    async showLocation(address) {
        try {
            console.log(`📍 正在进行地理编码: ${address}`);
            const result = await api.geocode(address);
            console.log('📍 地理编码结果:', result);
            
            if (result.success && result.data) {
                const { longitude, latitude } = result.data;
                console.log(`📍 获得坐标: [${longitude}, ${latitude}]`);
                
                // 设置地图中心
                this.map.setCenter([longitude, latitude]);
                
                // 添加标记
                const marker = new AMap.Marker({
                    position: [longitude, latitude],
                    title: address
                });
                
                this.map.add(marker);
                this.markers.push(marker);
                console.log(`✅ 成功添加标记: ${address}`);
                
                return { longitude, latitude };
            } else {
                console.warn(`⚠️ 地理编码失败: ${address}`, result);
            }
        } catch (error) {
            console.error('❌ 地理编码错误:', error);
        }
        
        return null;
    }

    async showItineraryOnMap(itinerary, destination) {
        console.log('🗺️ showItineraryOnMap 被调用');
        console.log('🗺️ itinerary:', itinerary);
        console.log('🗺️ destination:', destination);
        
        if (!this.map) {
            console.log('🗺️ 地图未初始化，正在初始化...');
            this.initMap();
        }
        
        if (!this.map) {
            console.error('❌ 地图初始化失败！');
            return;
        }

        this.clearMarkers();

        // 提取城市名称（去掉"江苏"等省份前缀）
        const cityName = destination.replace(/^(江苏|浙江|广东|四川|湖北|湖南|河南|河北|山东|山西|陕西|福建|安徽|江西|云南|贵州|甘肃|青海|海南|台湾|广西|西藏|宁夏|新疆|内蒙古|黑龙江|吉林|辽宁|北京|上海|天津|重庆)/, '');
        console.log('🗺️ 解析出城市名称:', cityName);

        // 先定位到目的地
        console.log('🗺️ 正在定位目的地:', destination);
        const cityCenter = await this.showLocation(destination);

        // 如果有每日行程，标记景点、餐厅和酒店
        if (itinerary.daily_itinerary) {
            console.log(`🗺️ 找到 ${itinerary.daily_itinerary.length} 天的行程`);
            const allLocations = [];

            for (const day of itinerary.daily_itinerary) {
                console.log(`🗺️ 处理第 ${day.day} 天的行程`);
                
                // 标记活动景点
                if (day.activities) {
                    console.log(`🗺️ 第 ${day.day} 天有 ${day.activities.length} 个活动`);
                    for (const activity of day.activities) {
                        if (activity.location) {
                            // 确定搜索关键词：优先使用 poi_name，其次是 activity 去掉动词
                            let searchKeyword = activity.poi_name || activity.activity;
                            // 如果没有 poi_name，尝试从 activity 中提取景点名称
                            if (!activity.poi_name) {
                                searchKeyword = searchKeyword.replace(/^(参观|游览|逛|品尝|漫步|散步|探访|体验|前往|去|到)/, '');
                            }
                            
                            console.log(`🗺️ 正在标记景点: ${activity.activity} - 搜索词: ${searchKeyword}`);
                            const coords = await this._addLocationMarker(
                                searchKeyword, cityName, activity.location,
                                `第${day.day}天: ${activity.activity}`,
                                'attraction',
                                {
                                    title: activity.activity,
                                    description: activity.description,
                                    time: activity.time
                                }
                            );
                            if (coords) allLocations.push(coords);
                        }
                    }
                }
                
                // 标记餐厅
                if (day.meals) {
                    const meals = [
                        { type: 'breakfast', name: '早餐', meal: day.meals.breakfast },
                        { type: 'lunch', name: '午餐', meal: day.meals.lunch },
                        { type: 'dinner', name: '晚餐', meal: day.meals.dinner }
                    ];
                    
                    for (const { type, name, meal } of meals) {
                        if (meal && typeof meal === 'object' && meal.restaurant_name) {
                            console.log(`🗺️ 正在标记${name}餐厅: ${meal.restaurant_name}`);
                            const searchKeyword = meal.poi_name || meal.restaurant_name;
                            const coords = await this._addLocationMarker(
                                searchKeyword, cityName, meal.address || '',
                                `第${day.day}天${name}: ${meal.restaurant_name}`,
                                'restaurant',
                                {
                                    title: meal.restaurant_name,
                                    address: meal.address,
                                    specialty: meal.specialty,
                                    avgCost: meal.avg_cost
                                }
                            );
                            // 不将餐厅加入路径规划
                        }
                    }
                }
                
                // 标记酒店
                if (day.accommodation && typeof day.accommodation === 'object' && day.accommodation.hotel_name) {
                    console.log(`🗺️ 正在标记酒店: ${day.accommodation.hotel_name}`);
                    const searchKeyword = day.accommodation.poi_name || day.accommodation.hotel_name;
                    const coords = await this._addLocationMarker(
                        searchKeyword, cityName, day.accommodation.address || '',
                        `第${day.day}天住宿: ${day.accommodation.hotel_name}`,
                        'hotel',
                        {
                            title: day.accommodation.hotel_name,
                            address: day.accommodation.address,
                            roomType: day.accommodation.room_type,
                            price: day.accommodation.price_per_night,
                            features: day.accommodation.features
                        }
                    );
                    // 不将酒店加入路径规划
                }
            }

            // 使用驾车路径规划绘制路径
            if (allLocations.length > 1) {
                console.log(`🗺️ 开始规划驾车路径，共 ${allLocations.length} 个点`);
                this.drawDrivingRoute(allLocations);
            }

            // 自动调整地图视野以显示所有标记
            if (allLocations.length > 0) {
                this.map.setFitView();
            }
        }
        
        // 如果没有详细行程数据，至少显示目的地信息
        if (!itinerary.daily_itinerary || itinerary.daily_itinerary.length === 0) {
            console.log('⚠️ 没有详细行程数据，仅显示目的地位置');
        }
    }

    /**
     * 添加位置标记的辅助函数
     * @param {string} searchKeyword - 搜索关键词
     * @param {string} cityName - 城市名称
     * @param {string} locationStr - 位置描述
     * @param {string} label - 标签文本
     * @param {string} markerType - 标记类型: 'attraction', 'restaurant', 'hotel'
     * @param {object} info - 详细信息对象
     * @returns {Array|null} 坐标 [lng, lat] 或 null
     */
    async _addLocationMarker(searchKeyword, cityName, locationStr, label, markerType, info) {
        try {
            // 优先使用 POI 搜索（更准确）
            let result = await api.searchPOI(searchKeyword, cityName);
            
            // 如果 POI 搜索失败或没结果，使用地理编码
            if (!result.success || !result.data || result.data.length === 0) {
                console.log(`⚠️ POI搜索失败，尝试地理编码: ${searchKeyword}`);
                const fullAddress = `${cityName}${locationStr}`;
                result = await api.geocode(fullAddress);
            }
            
            // 从结果中提取坐标
            let longitude, latitude;
            if (result.success && result.data) {
                if (Array.isArray(result.data) && result.data.length > 0) {
                    // POI 搜索结果
                    const poi = result.data[0];
                    longitude = poi.location.longitude;
                    latitude = poi.location.latitude;
                    console.log(`✅ POI搜索成功: ${poi.name} [${longitude}, ${latitude}]`);
                } else if (result.data.longitude && result.data.latitude) {
                    // 地理编码结果
                    longitude = result.data.longitude;
                    latitude = result.data.latitude;
                    console.log(`✅ 地理编码成功: [${longitude}, ${latitude}]`);
                }
            }
            
            if (longitude && latitude) {
                // 根据类型选择不同的图标和颜色
                let iconStyle = {};
                let infoContent = '';
                
                if (markerType === 'restaurant') {
                    // 餐厅标记 - 橙色
                    infoContent = `
                        <div style="padding: 10px; min-width: 200px;">
                            <h4 style="margin: 0 0 10px 0; color: #FF9800;">🍴 ${info.title}</h4>
                            ${info.address ? `<p style="margin: 5px 0;">📍 ${info.address}</p>` : ''}
                            ${info.specialty ? `<p style="margin: 5px 0;">🍽️ 推荐: ${info.specialty}</p>` : ''}
                            ${info.avgCost ? `<p style="margin: 5px 0;">💰 人均: ¥${info.avgCost}</p>` : ''}
                        </div>
                    `;
                } else if (markerType === 'hotel') {
                    // 酒店标记 - 绿色
                    infoContent = `
                        <div style="padding: 10px; min-width: 200px;">
                            <h4 style="margin: 0 0 10px 0; color: #4CAF50;">🏨 ${info.title}</h4>
                            ${info.address ? `<p style="margin: 5px 0;">📍 ${info.address}</p>` : ''}
                            ${info.roomType ? `<p style="margin: 5px 0;">🛏️ 房型: ${info.roomType}</p>` : ''}
                            ${info.price ? `<p style="margin: 5px 0;">💰 价格: ¥${info.price}/晚</p>` : ''}
                            ${info.features && info.features.length > 0 ? `<p style="margin: 5px 0;">✨ ${info.features.join('、')}</p>` : ''}
                        </div>
                    `;
                } else {
                    // 景点标记 - 蓝色（默认）
                    infoContent = `
                        <div style="padding: 10px; min-width: 200px;">
                            <h4 style="margin: 0 0 10px 0; color: #2196F3;">🎫 ${info.title}</h4>
                            ${info.description ? `<p style="margin: 5px 0;">${info.description}</p>` : ''}
                            ${info.time ? `<p style="margin: 5px 0;">⏰ ${info.time}</p>` : ''}
                        </div>
                    `;
                }

                // 添加标记
                const marker = new AMap.Marker({
                    position: [longitude, latitude],
                    title: info.title,
                    label: {
                        content: label,
                        direction: 'top'
                    }
                });

                // 添加信息窗口
                const infoWindow = new AMap.InfoWindow({
                    content: infoContent
                });

                marker.on('click', () => {
                    infoWindow.open(this.map, marker.getPosition());
                });

                this.map.add(marker);
                this.markers.push(marker);
                
                return [longitude, latitude];
            } else {
                console.warn(`⚠️ 无法获取坐标: ${searchKeyword}`);
                return null;
            }
        } catch (error) {
            console.error('❌ 标记地点错误:', error);
            return null;
        }
    }

    async searchNearby(keyword, city) {
        try {
            const result = await api.searchPOI(keyword, city);
            
            if (result.success && result.data) {
                this.clearMarkers();
                
                result.data.forEach(poi => {
                    if (poi.location && poi.location.longitude && poi.location.latitude) {
                        const marker = new AMap.Marker({
                            position: [poi.location.longitude, poi.location.latitude],
                            title: poi.name
                        });
                        
                        const infoWindow = new AMap.InfoWindow({
                            content: `
                                <div style="padding: 10px;">
                                    <h4>${poi.name}</h4>
                                    <p>${poi.address || ''}</p>
                                    <p>${poi.tel || ''}</p>
                                </div>
                            `
                        });
                        
                        marker.on('click', () => {
                            infoWindow.open(this.map, marker.getPosition());
                        });
                        
                        this.map.add(marker);
                        this.markers.push(marker);
                    }
                });
                
                if (this.markers.length > 0) {
                    this.map.setFitView();
                }
            }
        } catch (error) {
            console.error('搜索附近地点错误:', error);
        }
    }

    /**
     * 使用驾车路径规划绘制路线
     * @param {Array} locations - 坐标点数组 [[lng1, lat1], [lng2, lat2], ...]
     */
    drawDrivingRoute(locations) {
        if (!locations || locations.length < 2) {
            console.warn('⚠️ 至少需要2个点才能规划路径');
            return;
        }

        // 加载驾车路径规划插件
        AMap.plugin('AMap.Driving', () => {
            const driving = new AMap.Driving({
                map: this.map,
                policy: AMap.DrivingPolicy.LEAST_TIME, // 最快捷模式
                autoFitView: false // 禁用自动调整视野，我们手动控制
            });

            // 逐段规划路径（从第1个点到第2个，第2个到第3个...）
            let completedRoutes = 0;
            const totalRoutes = locations.length - 1;

            for (let i = 0; i < locations.length - 1; i++) {
                const start = new AMap.LngLat(locations[i][0], locations[i][1]);
                const end = new AMap.LngLat(locations[i + 1][0], locations[i + 1][1]);

                console.log(`🚗 规划路段 ${i + 1}/${totalRoutes}: [${locations[i]}] → [${locations[i + 1]}]`);

                driving.search(start, end, (status, result) => {
                    completedRoutes++;
                    
                    if (status === 'complete') {
                        console.log(`✅ 路段 ${completedRoutes}/${totalRoutes} 规划成功`);
                        
                        // 绘制路径
                        if (result.routes && result.routes.length > 0) {
                            const route = result.routes[0];
                            const path = [];
                            
                            route.steps.forEach(step => {
                                step.path.forEach(point => {
                                    path.push([point.lng, point.lat]);
                                });
                            });

                            // 创建路径线
                            const polyline = new AMap.Polyline({
                                path: path,
                                strokeColor: '#3b82f6',  // 蓝色
                                strokeWeight: 5,
                                strokeOpacity: 0.8,
                                strokeStyle: 'solid',
                                lineJoin: 'round',
                                lineCap: 'round',
                                zIndex: 50,
                                showDir: true  // 显示方向箭头
                            });

                            this.map.add(polyline);
                            this.polylines.push(polyline);
                        }
                    } else {
                        console.error(`❌ 路段 ${completedRoutes}/${totalRoutes} 规划失败:`, result);
                        
                        // 规划失败时，使用直线连接
                        console.log('⚠️ 改用直线连接');
                        const fallbackLine = new AMap.Polyline({
                            path: [start, end],
                            strokeColor: '#94a3b8',  // 灰色表示直线
                            strokeWeight: 3,
                            strokeOpacity: 0.6,
                            strokeStyle: 'dashed',  // 虚线
                            zIndex: 40
                        });
                        this.map.add(fallbackLine);
                        this.polylines.push(fallbackLine);
                    }

                    // 所有路段规划完成后的回调
                    if (completedRoutes === totalRoutes) {
                        console.log('🎉 所有驾车路径规划完成');
                    }
                });
            }
        });
    }
}

// 创建全局地图管理实例
const mapManager = new MapManager();

