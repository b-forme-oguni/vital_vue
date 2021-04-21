// 時間に関するパッケージをインポート
import moment from 'moment'
import axios from 'axios'
import moduleList from './vital/moduleList'

const url = 'http://localhost:8000/api/index/medicals'

// jsonからidと名前を抽出して文字列に変換
const alrtMsg = (data) => {
  let msg = ''
  if (Array.isArray(data)) {
    data.forEach((vital) => {
      msg += '【' + vital.id + '：' + vital.name + '】'
    })
  } else {
    let json = data.data.attribute
    msg += '【' + json.id + '：' + json.name + '】'
  }
  return msg
}

export default {
  namespaced: true,
  state: {
    vitalsList: [],
    vitalData: moduleList.vitalDate(),
    vitalValidate: {},
  },

  getters: {
    vitalsList: (state) => state.vitalsList,
    vitalData: (state) => state.vitalData,
    vitalValidate: (state) => state.vitalValidate,
    moduleList: () => moduleList,
  },

  mutations: {
    // ▼ DBから取得したバイタル一覧をstateに反映
    vitalsListSet(state, payload) {
      state.vitalsList = payload.data.map((data) => {
        let attribute = data.data.attribute
        // timedate型の文字列dayをMomentインスタンスに変換
        attribute.day = moment(attribute.day)
        return attribute
      })
    },

    // ▼ DBから取得した利用者１件をstateに反映
    vitalDataSet(state, payload) {
      let attribute = payload.data.attribute
      delete attribute.created_at
      state.vitalData = attribute
    },

    // ▼ vitalDataの各プロパティに、Inputされた値を入力する
    inputVitalData(state, { name, text }) {
      state.vitalData[name] = text
    },

    // ▼ vitalValidateにプロパティと値を追加する
    inputValidate(state, e) {
      state.vitalValidate = e
    },

    // ▼ vitalData、vitalValidateオブジェクトをリセット
    resetData(state) {
      // vitalDataオブジェクトを初期化する
      state.vitalData = vitalDate()
      // vitalValidateオブジェクトを空にする
      state.vitalValidate = {}
    },
  },

  actions: {
    // ▼ 非同期通信でDBからバイタル一覧データを取得
    vitalsListSet({ commit }, input) {
      axios
        .get(url + '?user_id=' + input.user_id + '&month=' + input.year_month)
        .then((response) => {
          console.log(response)
          // vitalをstateに反映
          commit('vitalsListSet', response.data)
        })
        .catch((error) => {
          console.log(error)
        })
    },

    // ▼ 非同期通信でapiから利用者１件を取得
    async showVital({ commit }, id) {
      await axios
        .get(url + '/' + id)
        .then((response) => {
          console.log(response)
          // vitalsをstateに反映
          commit('vitalDataSet', response.data)
        })
        .catch((error) => {
          console.log(error)
        })
    },

    // ▼ 非同期通信でDBからチェックを付けたVitalを削除
    async removeVitalsList({ dispatch, state }) {
      // stateのvitalsListから、checkが付いているvitalのみをdelete_vitalsに抽出
      let delete_vitals = state.vitalsList.filter((data) => data.check === true)
      // delete_vitalsから、idと名前のみをオブジェクトリテラルで配列に入れる
      let json = delete_vitals.map((vital) => ({ id: vital.id, name: vital.name }))
      // 非同期通信でapiにjsonで削除対象を送信
      !!json.length &&
        (await axios
          .post(url + '/selectdelete', json)
          .then((response) => {
            console.log(response)
            // DBへの削除が完了したら、新しいDB情報をstateに再取得する
            dispatch('vitalsListSet')
            alert(alrtMsg(json) + 'を削除しました')
          })
          .catch((error) => {
            console.log(error)
          }))
    },

    // ▼ 非同期通信でVitalDataをDBに登録
    async vitalRegist({ dispatch, state }) {
      // jsonで送るデータをオブジェクトのまま取得
      var json = state.vitalData
      // 非同期通信でapiにjsonで送信
      await axios
        .post(url, json)
        .then((response) => {
          console.log(response)
          alert(alrtMsg(response.data) + 'を登録しました')
        })
        .catch((error) => {
          console.log(error)
        })
      // DBへの登録が完了したら、新しいDB情報をstateに再取得する
      dispatch('vitalsListSet')
    },

    // ▼ 非同期通信でDBからVitalDataを更新
    async vitalEdit({ dispatch, state }) {
      // jsonで送るデータをオブジェクトのまま取得
      var json = state.vitalData
      // 非同期通信でapiにjsonで送信
      await axios
        .put(url + '/' + json.id, json)
        .then((response) => {
          console.log(response)
          alert(alrtMsg(response.data) + 'を変更しました')
        })
        .catch((error) => {
          console.log(error)
        })
      // DBへの登録が完了したら、新しいDB情報をstateに再取得する
      dispatch('vitalsListSet')
    },

    // ▼ フォームに入力があった場合、VitalData{}の対応するキーに値を入れる
    inputForm({ commit }, e) {
      commit('inputVitalData', e)
    },

    // ▼ 入力したvitalDataをstateから削除
    resetData({ commit }) {
      commit('resetData')
    },

    // ▼ stateのvitalDataの対応する状態に対し、vitalValidateにの対応するキーにエラーメッセージを追加する
    Validate({ commit, state }) {
      let e = {}
      !state.vitalData.name ? (e.name = '名前を入力してください') : (e.name = '')
      !state.vitalData.age && state.vitalData.age !== 0
        ? (e.age = '年齢を入力してください')
        : (e.age = '')
      !state.vitalData.sex ? (e.sex = '性別を選択してください') : (e.sex = '')
      !state.vitalData.diagnosis
        ? (e.diagnosis = '診断名を入力してください')
        : (e.diagnosis = '')
      commit('inputValidate', e)
    },
  },
}
