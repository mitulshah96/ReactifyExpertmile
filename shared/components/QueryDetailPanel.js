import React, {PropTypes}           from 'react/lib/React';
import ReactDOM  	                  from 'react-dom';
import browserHistory               from 'react-router/lib/browserHistory';
import connect                      from 'react-redux/lib/components/connect';
import fetchData                    from '../lib/fetchDataDeferred';
import * as QueryActions            from '../actions/QueryActions';
import { selectQuery, isEditable }  from '../reducers/QueryReducer';
import PostDetailView               from './presentational/PostDetailView';
import asyncLoaderInstance	        from '../instances/AsyncLoaderInstance';
import ImmutablePropTypes           from 'react-immutable-proptypes';
import MenuBar                      from  './MenuBar';
import Dialog                       from  './Dialog';
import menuInstance	                from '../instances/MenuInstance';
import shareInstance	              from '../instances/ShareInstance';
import Share                        from './Share';

@fetchData((state, dispatch, params) => {
  if (state === undefined) {
    return dispatch(QueryActions.loadAuth()).then((res) => {
      return dispatch(QueryActions.getDetailedPost(params.id, res.data.id));
    })
  }
})
@connect(state => ({
  queries:         state.queries,
  queryIdsOrdered: state.queryIdsOrdered,
  selectQuery:     selectQuery.bind(null, state),
  paginate:        state.paginateQuery,
  auth:            state.auth,
  statusCreator:   state.statusCreator,
  editable:        isEditable(state)
}),
  QueryActions
)
export default class QueryDetailPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    queries:             ImmutablePropTypes.map.isRequired,
    auth:                ImmutablePropTypes.map.isRequired,
    paginate:            ImmutablePropTypes.map.isRequired,
    statusCreator:       ImmutablePropTypes.map.isRequired,
    queryIdsOrdered:     ImmutablePropTypes.list.isRequired,
    editable:            PropTypes.bool.isRequired,
    selectQuery:         PropTypes.func.isRequired,
    loadComments:        PropTypes.func.isRequired,
    unloadComments:      PropTypes.func.isRequired,
    handleHelpful:       PropTypes.func.isRequired,
    handleImprove:       PropTypes.func.isRequired,
    handleLike:          PropTypes.func.isRequired,
    handleUnlike:        PropTypes.func.isRequired,
    handleComment:       PropTypes.func.isRequired,
    handleCommentDelete: PropTypes.func.isRequired,
    addComment:          PropTypes.func.isRequired,
    handleDeletePost:    PropTypes.func.isRequired,
    readMore:            PropTypes.func.isRequired
  };

  componentDidMount() {
    this.view = ReactDOM.findDOMNode(this).querySelector('.js-details-view');
    this.reveal = this.view.querySelector('.js-box-reveal');
    this.panel = this.view.querySelector('.js-details-panel');
    if (typeof window.AsyncLoaderInstance_ !== 'undefined') {
      this.show();
    } else {
      asyncLoaderInstance().then(load => {
        load.loadCSS('/timeline/styles/detailedPanel.css').then(() => {
          this.show();
        });
      });
    }
  }

  componentWillUnmount() {
    const { selectQuery, params } = this.props;
    if (selectQuery(params.id).get('Total_Comments') > 1) {
     this.props.unloadComments(params.id);
    }
  }

  shouldComponentUpdate(nextProps) {
    const { queries, auth, children } = this.props;
    return !queries.equals(nextProps.posts) || !auth.equals(nextProps.auth) || children != nextProps.children;
  };

  show(data) {
    if (typeof window.AsyncLoaderInstance_ !== 'undefined') {
      this.showPanel(data);
    } else {
      asyncLoaderInstance().then(load => {
        load.loadCSS('/timeline/styles/detailedPanel.css').then(() => {
         this.showPanel(data);
        });
      });
    }
  };

  showPanel() {
    const { selectQuery, params } = this.props;
    this.view.classList.add('details-view--visible');
    this.reveal.classList.add('details-view__box-reveal--visible');
    this.view.classList.remove('hidden');
    this.panel.style.transform = '';

    this.reveal.classList.add('details-view__box-reveal--expanded');
    this.panel.classList.add('details-view__panel--visible');
    ReactDOM.findDOMNode(this.refs.underPanel).classList.add('view-underpanel--visible');

    this.panel.style.transform = 'translateX(1050px)';
    this.reveal.style.transform = 'translateX(1050px)';

    setTimeout(() => {
      requestAnimationFrame(() => {
        this.reveal.classList.add('details-view__box-reveal--animatable');
        this.reveal.classList.add('details-view__box-reveal--expanded');
        this.reveal.style.transform = '';

        this.panel.classList.add('details-view__panel--visible');
        this.panel.classList.add('details-view__panel--animatable');
        this.panel.style.transform = '';
      });
      if (selectQuery(params.id).get('Total_Comments') > 1) {
        this.props.loadComments(params.id, this.props.auth.get('id'));
      }
    }, 5);
  }

  hide() {
    const { selectQuery, params } = this.props;
    this.view.classList.remove('details-view--visible');
    this.panel.classList.remove('details-view__panel--visible');
    this.reveal.classList.remove('details-view__box-reveal--expanded');
    this.reveal.classList.add('details-view__box-reveal--animatable');
    requestAnimationFrame(() => {
      this.panel.style.transform = 'translateX(1050px)';
      this.reveal.style.transform = 'translateX(1050px)';
      if (selectQuery(params.id).get('Total_Comments') > 1) {
        this.props.unloadComments(params.id);
      }
      var removeRevealTransform = () => {
        this.panel.classList.remove('details-view__panel--animatable');

        this.reveal.removeEventListener('transitionend', removeRevealTransform);
        this.reveal.classList.remove('details-view__box-reveal--animatable');
        this.reveal.style.transform = '';
        this.panel.style.transform = '';
        browserHistory.push('/timeline/answer');
      }

      var hideElements = () => {
        this.reveal.removeEventListener('transitionend', hideElements);
        this.reveal.addEventListener('transitionend', removeRevealTransform);
        this.reveal.classList.remove('details-view__box-reveal--visible');
      }

      ReactDOM.findDOMNode(this.refs.underPanel).classList.remove('view-underpanel--visible');
      this.reveal.addEventListener('transitionend', hideElements);
    });
  }

  handleBackButton = () => {
    this.hide();
  }

  handleHelpful = (postID, commentID, Index, helpValue, unHelpValue) => {
    this.props.handleHelpful(postID, commentID, Index, helpValue, unHelpValue, this.props.auth.get('id'));
  }

  handleImprove = (postID, commentID, Index, helpValue, unHelpValue) => {
    this.props.handleImprove(postID, commentID, Index, helpValue, unHelpValue, this.props.auth.get('id'));
  }

  handleLike = (statusID, currentValue) => {
    this.props.handleLike(statusID, currentValue, this.props.auth.get('id'));
  }

  handleUnlike = (statusID, currentValue) => {
    this.props.handleUnlike(statusID, currentValue, this.props.auth.get('id'));
  }

  handleReadMore = (id, text) => {
    this.props.readMore(id, text);
  };

  onShareClick = (id, text) => {
    shareInstance().then(() => {
      return this.refs.share.show(
        id, text
      );
    })
  }

  handleMenuBar = (postID) => {
    menuInstance()
      .then(() => {
        return this.refs.menu.show(postID);
      }).then((data) => {
        this.handleMenuPop(data);
      })
  }

    handleMenuPop = (data) => {
    if (data.button === 'edit') {
      if (typeof window.AsyncLoaderInstance_ !== 'undefined') {
        browserHistory.push(`/timeline/create/${data.postID}`);
      } else {
        asyncLoaderInstance().then(load => {
          load.loadCSS('/timeline/styles/detailedPanel.css').then(() => {
            browserHistory.push(`/timeline/create/${data.postID}`);
          });
        });
      }
    } else {
      menuInstance()
        .then(() => {
          return this.refs.dialog.show(
            'Confirm Delete',
            'Are you sure you want to delete this update?',
            data.postID
          );
        }).then((idToDelete) => {
          this.props.handleDeletePost(idToDelete, this.props.auth.get('id'));
          browserHistory.push('/timeline/');  
      })
    }
  }

  setFocus = () => {
    ReactDOM.findDOMNode(this.refs.editor).focus();
  }

  emitChange = () => {
    this.props.handleComment(ReactDOM.findDOMNode(this.refs.editor).innerText);
  }

  postComment = () => {
    this.props.addComment(ReactDOM.findDOMNode(this.refs.editor).innerText, this.props.params.id, this.props.auth.get('id'));
    ReactDOM.findDOMNode(this.refs.editor).textContent ='';
  }

  handleCommentDelete = (postID, commentID, Index) => {
    this.props.handleCommentDelete(postID, commentID, Index);
  }

  render() {
    const styles = require('../scss/master.scss');
    const { auth, selectQuery, params, editable } = this.props;
    const query = selectQuery(params.id);
    return (
      <div>
        <div ref="underPanel" className="view-underpanel js-underpanel">
          <div className="view-underpanel__block"></div>
        </div>
        <MenuBar ref="menu" />

        <Dialog ref="dialog" />

        <Share ref="share" />

        <section className="hidden details-view js-details-view">

          <div className="details-view__panel js-details-panel">

            <div className="details-view__header js-details-panel-header">
              <div className="details-view__header-buttons">
                <button onClick={this.handleBackButton} className="details-view__back js-back"></button>
              </div>
              <h1 className="details-view__title js-title"></h1>
            </div>

            <aside className="details-view__content">
              <PostDetailView
                post={query}
                auth={auth}
                onHelpful={(commentID, Index, helpValue, unHelpValue) => this.handleHelpful(params.id, commentID, Index, helpValue, unHelpValue) }
                onImprove={(commentID, Index, helpValue, unHelpValue) => this.handleImprove(params.id, commentID, Index, helpValue, unHelpValue) }
                onCommentDelete={(commentID, Index) => this.handleCommentDelete(params.id, commentID, Index) }
                onPostLike={() => this.handleLike(params.id, query.get('likes')) }
                onPostUnlike={() => this.handleUnlike(params.id, query.get('likes')) }
                handleMenuBar = {() => this.handleMenuBar(params.id) }
                handleShare={(text) => this.onShareClick(params.id, text)}
                onReadMore={() => this.handleReadMore(params.id, selectQuery(params.id)) }
                onSetFocus = {this.setFocus} />
            </aside>

            { editable ? <div className="details-view__footer">
              <div className="col_xs_10">
                <div onInput={this.emitChange}
                  contentEditable={true}
                  placeholder="Add a comment..."
                  ref="editor"
                  className="mdl-commentpanel__editor"
                  spellCheck={true} />

                <button className={styles.mdl_transparant__btn} onClick={this.postComment}>Post</button>
              </div>
            </div> : null }

          </div>

          <div className="details-view__box-reveal js-box-reveal"></div>

        </section>
      </div>
    )
  }
}