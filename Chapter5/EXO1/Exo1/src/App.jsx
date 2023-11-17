import styled from 'styled-components';
import copy from '../image/icon-copy.svg';
import arrow from '../image/icon-arrow-right.svg';
const App=()=>{
  return(
<Container>
  <Title><h1>Password Generator</h1></Title>
  <Password>
    <h1></h1>
    <img src={copy}/>
  </Password>
  <Content>
    <Header>
      <h1>Character Length</h1>
      <h1></h1>
    </Header>
    <Range>
      <input type="range" />
    </Range>
    <Check>
      <div className="chek"><input type="checkbox"/><h1>Include UpperCase Letters</h1></div>
      <div className="chek"><input type="checkbox"/><h1>Include LowerCase Letters</h1></div>
      <div className="chek"><input type="checkbox"/><h1>Include Numbers</h1></div>
      <div className="chek"><input type="checkbox"/><h1>Include Symbols</h1></div>
    </Check>
    <Generate><button type="submit">GENERATE</button>
    <img src={arrow} />
    </Generate>
  </Content>
</Container>
)};
export default App

const Container=styled.div`
background-color: black;
color: white;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
gap: 10px;
`;
const Title=styled.div``;
const Password=styled.div``;
const Content=styled.div``;
const Header=styled.div``;
const Range=styled.div``;
const Check=styled.div``;
const Generate=styled.div``;

