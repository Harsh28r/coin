import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap'

export function TopNav() {
  return (
    <Navbar bg="white" className="py-2 border-bottom font-inter fw-medium fs-6 lh-sm" style={{ letterSpacing: '0.04em' }}>
      <Container fluid style={{ width: '90%' }} className="px-3">
        <Navbar.Collapse id="market-nav" className="d-flex flex-wrap overflow-auto">
          <Nav className="me-auto d-flex flex-nowrap">
            <div className="d-flex flex-row">
              <Nav.Item className="d-flex align-items-center px-3 py-2">
                <span>COMP</span>
                <span className="ms-2 text-success">56.54</span>
                <span className="ms-2 text-success">1.15%</span>
              </Nav.Item>
              <Nav.Item className="d-flex align-items-center px-3 py-2">
                <span>COMP</span>
                <span className="ms-2 text-success">56.54</span>
                <span className="ms-2 text-success">1.15%</span>
              </Nav.Item>
              <Nav.Item className="d-flex align-items-center px-3 py-2">
                <span>COMP</span>
                <span className="ms-2 text-success">76.54</span>
                <span className="ms-2 text-success">1.15%</span>
              </Nav.Item>
              <Nav.Item className="d-flex align-items-center px-3 py-2">
                <span>BTC Dominance</span>
                <span className="ms-2 text-success">58.98%</span>
              </Nav.Item>
              <Nav.Item className="d-flex align-items-center px-3 py-2">
                <span>Fear & Greed Index</span>
                <span className="ms-2 text-success">45</span>
              </Nav.Item>
              <Nav.Item className="d-flex align-items-center px-3 py-2">
                <span>BTC Dominance</span>
                <span className="ms-2 text-success">58.98%</span>
              </Nav.Item>
              <Nav.Item className="d-flex align-items-center px-3 py-2">
                <span>Gas</span>
                <span className="ms-2 text-success">25 Gwei</span>
              </Nav.Item>
            </div>
          </Nav>
          <Nav className="flex-row flex-nowrap">
            <NavDropdown title="En" id="language-dropdown" align="end">
              <NavDropdown.Item>English</NavDropdown.Item>
              <NavDropdown.Item>Español</NavDropdown.Item>
              <NavDropdown.Item>Français</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="USD" id="currency-dropdown" align="end">
              <NavDropdown.Item>USD</NavDropdown.Item>
              <NavDropdown.Item>EUR</NavDropdown.Item>
              <NavDropdown.Item>GBP</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link href="#profile" style={{ position: 'absolute', right: '20px', color: 'black' }}>
              <i className="fa fa-user" aria-hidden="true"></i>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
     
    </Navbar>
  )
}









