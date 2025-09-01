import java.awt.*; 
import java.applet.Applet;   
import java.util.Random;

public class Thing extends TowerDefenseFinal
{ 
	private int xLocation;
	private int yLocation;
	
	protected int diviser;
	
	public Thing(int x, int y, int d)
	{
		xLocation = x;
		yLocation = y;
		diviser = d;
	}
	
	public int getX()
	{
		return xLocation;
	}
	
	public int getY()
	{
		return yLocation;
	}
	
	public void setX(int n)
    {
    	xLocation += n;
    }
    
 	public void setY(int n)
    {
    	yLocation += n;
    }
    
    public void warpX(int n)
    {
    	xLocation = n;
    }
    
    public void warpY(int n)
    {
    	yLocation = n;
    }
}