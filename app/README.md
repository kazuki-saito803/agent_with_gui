# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).


お〜いい視点ですね！👏
はい、まさに TypeScript の静的型チェックが原因ですが、「どういうロジックでこのエラーが出たのか」をもう少し掘り下げると以下の流れになります。

⸻

✅ React + TypeScript で JSX が処理される流れ
	1.	JSX の <SubmitButton>button</SubmitButton> をパース
	•	TypeScript はこれを

React.createElement(SubmitButton, { children: "button" })

に変換して解釈します。

⸻

	2.	SubmitButton コンポーネントの型を確認
	•	TypeScript は SubmitButton の型を見て、
	•	どんな props を受け取れるか
	•	children を許可しているか
をチェックします。
例えば SubmitButton: React.FC<SubmitButtonProps> であれば、React.FC によって暗黙的に

{ children?: React.ReactNode }

が props に含まれます。

⸻

	3.	受け渡し props の型チェック
	•	JSX からは { children: "button" } という props オブジェクトが渡ってきます。
	•	TypeScript はこの { children: string } が SubmitButton の props 型に一致するかどうかを検証します。

⸻

	4.	型不一致ならエラー
	•	もし SubmitButton がただの const SubmitButton: () => JSX.Element みたいに定義されていて、props 型を受け取らない場合、TypeScript から見れば「このコンポーネントは props を受け取らない型」になります。
	•	そこに { children: "button" } が渡されるので、「props 型と合ってない」とエラーになるわけです。
エラーメッセージの

Type '{ children: string; }' has no properties in common with type 'IntrinsicAttributes'

はまさに「このコンポーネントは IntrinsicAttributes (特殊属性) しか受け取れないのに、children を渡してるぞ」と言ってる状態。

⸻

✅ つまり根本原因は？
	•	JSX は children を props として渡す仕組みになっている
	•	なのにコンポーネント側の型に children が含まれていなかった
	•	そのため 型の不一致 として TypeScript が静的に検出 → エラー

⸻

✅ わかりやすい例

const NoProps = () => <div>No props</div>;

// ❌ エラー: children は定義されていない
<NoProps>button</NoProps>;

const WithProps: React.FC = ({ children }) => <div>{children}</div>;

// ✅ OK: React.FC によって children が型定義されている
<WithProps>button</WithProps>;


⸻

🔑 まとめると：
	•	JSX → React.createElement(Component, { children })
	•	TS が「children は型定義されてる？」をチェック
	•	含まれてなければ「不一致」エラー

⸻

Matheusはもっと「TypeScript コンパイラが JSX を型推論する内部処理フロー」まで追いたい？
それとも「エラーが出る理由がわかればOK」くらいで大丈夫そうですか？