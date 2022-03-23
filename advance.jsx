import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Popup, DropdownMenu  } from 'react-vant';
import { CSSTransition } from "react-transition-group";
import { useAsync } from "@/hooks";
import Api from "@/service/api"
import Util from "@/util";
import 'react-vant/lib/dropdown-menu/style';
import "./index.scss"

// 数组中移除某一个元素
const remove = (arr, str) => {
    let index = arr.indexOf(str);
    let newArr = [];
    if ( index != -1 && index != 0) {
        newArr = arr.slice(0, index);
        newArr.push(...arr.slice(index + 1, arr.length));
    } else if ( index != -1 && index == 0 ) {
        arr.shift();
        newArr = [...arr];
    } else {
        newArr = [...arr];
    }
    return newArr;
}
// 已逗号为分隔符的字符串转换成数组
const strToArr = (str) => {
    let arr = str ? str.split(',') : [];
    return arr;
}
// 数组转换成已逗号为分隔符的字符串
const arrToStr = (arr) => {
    let str = '';
    arr.map((item) => {
        str = str + item + ','
    });
    str = str.slice(0, str.length - 1);
    return str;


}

const ChooseTag = memo(( {chooseItems=[], unset, defaultValue=[], getSearchValue, close} ) => {
    const [allActive, setAllActive] = useState(defaultValue || unset ? true : false);
    const [ulHeight, setUlHeight] = useState(0);

    const searchRef = useRef(defaultValue);

    const ulEle = useCallback((node) => {
        if ( node != null ) {
            setUlHeight(node.offsetHeight)
        }
    });

    useEffect(() => {
        if (unset) {
            setAllActive(true);
            searchRef.current = [];
        }
    }, [unset])

    const handleAllClick = () => {
        setAllActive(true);
        searchRef.current = [];
        getSearchValue(arrToStr(searchRef.current));
    };

    const handleClick = (id, activeFlag) => {
        setAllActive(false);
        if ( activeFlag ) {
            searchRef.current.push(id);
        } else {
            searchRef.current = searchRef.current.includes(id) ? remove(searchRef.current, id) : searchRef.current;
        }
        getSearchValue(arrToStr(searchRef.current));
    }

    return <CSSTransition in={ !close } timeout={0} 
        onEnter={ (ele) => { ele.style.height = 0 + 'px' } }
        onEntering={(ele) => { ele.style.height = ulHeight * 0.5 + 'px' }} 
        onEntered={(ele) => { ele.style.height = ulHeight + 'px' }}
        onExit={ (ele) => { ele.style.height = ulHeight + 'px' } }
        onExiting={ (ele) => { ele.style.height = ulHeight * 0.5 + 'px' } }
        onExited={ (ele) => { ele.style.height = 0 + 'px' } }
    > 
        <div className={`transition-container`}>
        {
            <ul className={`search-list`} ref={ulEle}>
                <li className={ allActive ? 'active all' : 'all'} onClick={ handleAllClick }>全部</li>
                {
                    chooseItems.map((item, index) => {
                        return <SmallAdvancedSearch id={item.value} activeFlag={ defaultValue.includes(item.value) && !allActive ? true : false } value={ item.text } onClick={ handleClick } key={index}></SmallAdvancedSearch>
                    })
                }
            </ul>
        }
        </div>
    </CSSTransition>
})

const SmallAdvancedSearch = memo(({id, value, onClick, activeFlag=false}) => {
    const [active, setActive] = useState(activeFlag);

    const handleClick = (activeFlag) => {
        setActive(!activeFlag);
        onClick(id, !activeFlag);
    };

    useEffect(() => {
        setActive(activeFlag);
    }, [activeFlag]);

    return <li className={`search-li ${ active ? "active" : "" } `} data-id={id} onClick={() => { handleClick(active) }}>
        {value}
    </li>
});

const GradesSearch = memo(({getSearchValue, unset, nodeChange, defaultValue}) => {

    const [data, setData] = useState([]);
    const [close, setClose] = useState(false);

    useEffect(() => {
        Api.courseProperty.get({type: 'grade'}).then((res) => {
            setData(res.data.data);
        })
    }, []);

    const handleClick = (str) => {
        getSearchValue("grade_id", str);
    };

    const handleIconClick = () => {
        setClose((preValue) => {return !preValue});
    }

    return <div className="part">
    <div className="title">
        <span>适读年级</span>
        <div className="iconfont-container"><i className={`iconfont icon-31fanhui1 ${close ? 'close' : ''}`} onClick={() => {handleIconClick(close)}} ></i></div>
    </div>
    <div className="ul-container">
        <ChooseTag chooseItems={data} unset={unset} defaultValue={strToArr(defaultValue)} getSearchValue={handleClick} close={close}></ChooseTag>
    </div>
</div>
    
    
});

const ThemeSearch = memo(( { defaultValue, getSearchValue, unset, nodeChange } ) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [themeData, setThemeData] = useState([]);
    const [close, setClose] = useState(defaultValue.column_id ? false : true);

    const searchRef = useRef({topic_id: defaultValue.topic_id, column_id: defaultValue.column_id});

    // 获取主题数据(看看是不是要依赖于空数组)
    useEffect(() => {
        // 如果是在线课程，获取在线课程的分类
        if (defaultValue.onlineSign) {
            Api.onlineCourseCate.get().then((res) => {
                setThemeData(res.data.data);
                res.data.data.length === 1 && setActiveIndex(0);
            });
        } else {
            Api.columnTopic.get({column_id: defaultValue.column_id}).then((res) => {
                setThemeData(res.data.data);
                res.data.data.length === 1 && setActiveIndex(0);
                
            });
        }
    }, []);

    const handleClick = (str) => {
        searchRef.current.topic_id = str;
        if (defaultValue.onlineSign) {
            getSearchValue({cate_id: str});
        } else {
            getSearchValue({topic_id: str, column_id: searchRef.current.column_id});
        }
        
        
    };

    const handleChange = (e) => {
        setClose(false);
        themeData.map((item, index) => {
            if ( item.value === e.themeId ) {
                setActiveIndex(index);
            }
        });
        let variable = defaultValue.onlineSign ? 'cate_id' : 'column_id';
        console.log("variable", variable);
        searchRef.current.column_id = e.themeId;
        getSearchValue({[variable]: e.themeId});
    };

    return <div>
        <div>{ defaultValue.onlineSign ? '分类' : '主题' }</div>
        <DropdownMenu activeColor="#0062cc" overlay={ false } onChange={ (e) => { handleChange(e) } } value={ activeIndex !== null ? { themeId: themeData[activeIndex].value } : '' }>
            <DropdownMenu.Item options={themeData} name="themeId" placeholder={ defaultValue.onlineSign ? '请选择你的分类' : '请选择你的主题' }/>
        </DropdownMenu>
        <div className="part">
            <div className="ul-container" >
                {
                    close ? '' : <ChooseTag chooseItems={activeIndex !== null ? themeData[activeIndex].children : []} unset={unset} defaultValue={strToArr(defaultValue.topic_id)} getSearchValue={handleClick} />
                }
            </div>
        </div>
    </div>
})

/* 
        visible："弹窗是否可见"
        data: "传递过来的数据"
        onClickOverlay: "点击遮罩触发的事件处理函数"
        onConfirm： "点击确定按钮所触发的事件处理函数"
 */

export const AdvancedSearch = memo(({visible=false, onConfirm=() => {},  onClickOverlay = () => {}, defaultValue={}}) => {

    // 重置的状态
    const [unset, setUnSet] = useState(false);
    // 存储搜索数据（应该不包括word关键字）
    const [submitValue, setSubmitValue] = useState( Object.assign( { grade_id: '', topic_id: '', column_id: '', title:'', onlineSign: false }, defaultValue ) );
    // 滚动条的宽度
    const [scrollBarWidth, setScrollBarWidth] = useState(0);
    // 未知
    const [advanceSearchWidth, setAdvanceSearchWidth] = useState(0);

    const panelEle = useCallback(node => {
        if (node !== null) {
            setScrollBarWidth(node.offsetWidth - node.scrollWidth);
        }
    }, []);
    const advanceSearch = useCallback(node => {
        if (node !== null) {
            setAdvanceSearchWidth(node.offsetWidth - 0);
        }
    }, []);

    // 年级tab的点击事件
    const handleClick = (inputName, str) => {
        setUnSet(false);
        setSubmitValue((pre) => {
            let obj = {...pre};
            obj[inputName] = str;
            return {...obj};
        })
    }
    // 主题的点击事件
    const handleThemeClick = (searchValue) => {
        setUnSet(false);
        setSubmitValue((pre) => {
            let obj = {...pre};
            let newObj = Object.assign(obj, searchValue);
            return {...newObj};
        })
    }
    // 弹窗的确定的点击事件
    const handleConfirm = (obj) => {
        console.log(obj);
        Api.course.get({
            ...obj
        }).then((res) => {
            onConfirm(obj, res?.data?.list);
        });
    };
    // 弹窗的确定的点击事件
    const handleConfirmOnline = (obj) => {
        Api.onlineCourse.get({
            ...obj
        }).then((res) => {
            onConfirm(obj, res?.data?.list);
        });
    }
    // 弹窗的重置事件
    const handleReset = () => {
        setUnSet(true);
        setSubmitValue({column_id: defaultValue.column_id});
    };

    return <Popup visible={visible} position="right" onClick={onClickOverlay} className="advanceSearchPopup">
        <div className={`advanceSearch`} ref={advanceSearch} style={advanceSearchWidth && scrollBarWidth ? {width: advanceSearchWidth + scrollBarWidth + 'px'} : {}}>
            <div className="content" onClick={(e) => {e.stopPropagation()}}>
                <div className="top">
                    <i className="iconfont icon-shaixuan"></i>
                    <span>筛选</span>
                </div>
                <div className="choose-item">
                    {
                        <div className='theme'>
                            <div className='theme-choose-panel' ref={panelEle}>
                                <ThemeSearch defaultValue={{column_id: submitValue.column_id, topic_id: submitValue.topic_id, onlineSign: submitValue.onlineSign}} nodeChange={scrollBarWidth} getSearchValue={handleThemeClick} unset={unset}></ThemeSearch>
                            </div>
                        </div>
                    }
                    {
                        <div className="grade">
                            <div className="grade-choose-panel" >
                                <GradesSearch getSearchValue={handleClick} unset={unset} nodeChange={scrollBarWidth} defaultValue={submitValue.grade_id}></GradesSearch>
                            </div> 
                        </div>
                    }
                </div>
                <div className="part-btn">
                    <div>
                        <div onClick={ handleReset }>重置</div>
                        <div onClick={() => { submitValue.onlineSign ? handleConfirmOnline(submitValue) : handleConfirm(submitValue) }}>确定</div>
                    </div>
                </div>
            </div>
        </div>
    </Popup>;
})